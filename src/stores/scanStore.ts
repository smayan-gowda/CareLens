import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScanResult } from '@/types/ai';
import { db, cleanUndefined, handleFirestoreError, OperationType, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  serverTimestamp,
  setDoc,
  getDocs
} from 'firebase/firestore';

import { compressImageDataUrl } from '@/utils/imageCompression';
import { processImageForStorage } from '@/services/storageService';
import { getScoreFormulaBreakdown } from '@/components/reports/reportMath';

interface ScanState {
  scans: Record<string, ScanResult[]>;
  hiddenScans: string[];
  hideScan: (scanId: string) => void;
  loading: boolean;
  
  // Subscription management
  subscribe: (userId: string) => () => void;
  
  addScan: (userId: string, roomId: string, scan: Omit<ScanResult, 'id'>) => Promise<void>;
  deleteScan: (roomId: string, scanId: string) => Promise<void>;
  getScansForRoom: (roomId: string) => ScanResult[];
  getScanById: (scanId: string) => ScanResult | undefined;
  toggleRecommendation: (scanId: string, recommendationId: string) => Promise<boolean>;
  updateHazardFeedback: (scanId: string, hazardId: string, feedback: 'helpful' | 'not_present' | 'needs_review') => Promise<void>;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      scans: {},
      hiddenScans: [],
      hideScan: (scanId) => set((state) => ({ hiddenScans: [...state.hiddenScans, scanId] })),

      loading: false,

      subscribe: (userId: string) => {
        set({ loading: true });
        
        // Single field query prevents composite index failures on new environments
        const scansQuery = query(collection(db, 'scans'), where('userId', '==', userId));
        
        const unsub = onSnapshot(scansQuery, (snapshot) => {
          const scansMap: Record<string, ScanResult[]> = {};
          
          snapshot.docs.forEach(doc => {
            const scan = { id: doc.id, ...doc.data() } as ScanResult;
            if (!scansMap[scan.roomId]) {
              scansMap[scan.roomId] = [];
            }
            scansMap[scan.roomId].push(scan);
          });

          // Sort scans chronologically descending in memory
          for (const roomId in scansMap) {
            scansMap[roomId].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          }
          
          set({ scans: scansMap, loading: false });
        }, (error) => {
          console.error('Error subscribing to scans:', error);
          set({ loading: false });
        });

        return unsub;
      },

      addScan: async (userId, roomId, scanData) => {
        const scanId = (scanData as any).id || `scan-${Date.now()}`;
        let images = scanData.images 
          ? await Promise.all(scanData.images.map(img => processImageForStorage(img)))
          : scanData.images;

        let newScan = cleanUndefined({
          ...scanData,
          images,
          id: scanId,
          userId,
          roomId,
          createdAt: new Date().toISOString()
        });

        // Ensure total scan size fits strictly under 1 MB limit (950,000 bytes max)
        const SCAN_MAX_BYTES = 950000;
        let strLen = JSON.stringify(newScan).length;
        if (strLen > SCAN_MAX_BYTES && images && images.length > 0) {
          images = await Promise.all(
            images.map(img => (img.startsWith("http://") || img.startsWith("https://")) ? img : compressImageDataUrl(img, 3840, 3840, 0.95, 1000, true))
          );
          newScan = cleanUndefined({ ...newScan, images });
        }

        try {
          await setDoc(doc(db, 'scans', scanId), newScan);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'scans');
        }
      },

      deleteScan: async (roomId, scanId) => {
        // 1. Optimistically update local Zustand store and persistence so the UI removes the item immediately
        set((state) => {
          const newScans = { ...state.scans };
          if (newScans[roomId]) {
            newScans[roomId] = newScans[roomId].filter((s) => s.id !== scanId);
            if (newScans[roomId].length === 0) {
              delete newScans[roomId];
            }
          }
          // Also verify across all rooms in case scan was assigned to another room ID
          for (const rId of Object.keys(newScans)) {
            newScans[rId] = newScans[rId].filter((s) => s.id !== scanId);
            if (newScans[rId].length === 0) {
              delete newScans[rId];
            }
          }
          return { scans: newScans };
        });

        try {
          const userId = auth.currentUser?.uid;

          // 2. Try direct document deletion
          let docDeleted = false;
          try {
            await deleteDoc(doc(db, 'scans', scanId));
            docDeleted = true;
          } catch (directErr: any) {
            console.warn(`Direct delete for scans/${scanId} returned:`, directErr?.message);
          }

          // 3. Fallback: query in case document was stored with a different auto-ID
          if (!docDeleted) {
            try {
              const q = query(collection(db, 'scans'), where('id', '==', scanId));
              const querySnapshot = await getDocs(q);
              for (const document of querySnapshot.docs) {
                await deleteDoc(doc(db, 'scans', document.id));
              }
            } catch (queryErr: any) {
              console.warn(`Query deletion for scans matching id=${scanId} returned:`, queryErr?.message);
            }
          }

          if (userId) {
            // 4. Clean up associated timelineEvents (by scanId)
            try {
              const timelineQuery = query(
                collection(db, 'timelineEvents'),
                where('userId', '==', userId),
                where('scanId', '==', scanId)
              );
              const timelineSnapshot = await getDocs(timelineQuery);
              for (const document of timelineSnapshot.docs) {
                await deleteDoc(doc(db, 'timelineEvents', document.id));
              }

              // Fallback check by link for timelineEvents
              const allTimelineQuery = query(
                collection(db, 'timelineEvents'),
                where('userId', '==', userId)
              );
              const allTimelineSnapshot = await getDocs(allTimelineQuery);
              for (const document of allTimelineSnapshot.docs) {
                const data = document.data();
                if (data.link && data.link.includes(`/reports/${scanId}`)) {
                  await deleteDoc(doc(db, 'timelineEvents', document.id));
                }
              }
            } catch (e) {
              console.warn('Error cleaning up timeline events:', e);
            }

            // 5. Clean up associated notifications (by scanId)
            try {
              const notificationsQuery = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('scanId', '==', scanId)
              );
              const notificationsSnapshot = await getDocs(notificationsQuery);
              for (const document of notificationsSnapshot.docs) {
                await deleteDoc(doc(db, 'notifications', document.id));
              }

              // Fallback check by link for notifications
              const allNotificationsQuery = query(
                collection(db, 'notifications'),
                where('userId', '==', userId)
              );
              const allNotificationsSnapshot = await getDocs(allNotificationsQuery);
              for (const document of allNotificationsSnapshot.docs) {
                const data = document.data();
                if (data.link && data.link.includes(`/reports/${scanId}`)) {
                  await deleteDoc(doc(db, 'notifications', document.id));
                }
              }
            } catch (e) {
              console.warn('Error cleaning up notifications:', e);
            }

            // 6. Clean up associated activities (by scanId)
            try {
              const activitiesQuery = query(
                collection(db, 'activities'),
                where('userId', '==', userId),
                where('scanId', '==', scanId)
              );
              const activitiesSnapshot = await getDocs(activitiesQuery);
              for (const document of activitiesSnapshot.docs) {
                await deleteDoc(doc(db, 'activities', document.id));
              }
            } catch (e) {
              console.warn('Error cleaning up activities:', e);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `scans/${scanId}`);
        }
      },

      getScansForRoom: (roomId) => {
        return get().scans[roomId] || [];
      },

      getScanById: (scanId) => {
        for (const roomId in get().scans) {
          const scan = get().scans[roomId].find((s) => s.id === scanId);
          if (scan) return scan;
        }
        return undefined;
      },

      toggleRecommendation: async (scanId, recommendationId) => {
        const scan = get().getScanById(scanId);
        if (!scan) return false;

        const userId = auth.currentUser?.uid || (scan as any).userId;
        const initialScore = (scan as any).initialSafetyScore ?? scan.safetyScore;

        let recTitle = '';
        let recImpact = 0;
        let isCompletedNow = false;

        const updatedRecommendations = (scan.recommendations || []).map((r) => {
          if (r.id === recommendationId) {
            recTitle = r.title;
            recImpact = r.expectedImpact || 0;
            isCompletedNow = !r.completedAt;
            return {
              ...r,
              completedAt: isCompletedNow ? new Date().toISOString() : undefined,
            };
          }
          return r;
        });

        const completedRecs = updatedRecommendations.filter((r) => !!r.completedAt);
        const totalCompletedGain = completedRecs.reduce((sum, r) => sum + (r.expectedImpact || 0), 0);
        const newSafetyScore = Math.min(100, Math.round(initialScore + totalCompletedGain));

        const updatedScan = {
          ...scan,
          initialSafetyScore: initialScore,
          safetyScore: newSafetyScore,
          recommendations: updatedRecommendations,
        } as ScanResult;

        set((state) => {
          const newScans = { ...state.scans };
          if (newScans[scan.roomId]) {
            newScans[scan.roomId] = newScans[scan.roomId].map((s) => (s.id === scanId ? updatedScan : s));
          }
          return { scans: newScans };
        });

        try {
          await updateDoc(doc(db, 'scans', scanId), cleanUndefined({
            initialSafetyScore: initialScore,
            safetyScore: newSafetyScore,
            recommendations: updatedRecommendations,
          }));

          if (userId && isCompletedNow) {
            await addDoc(collection(db, 'timelineEvents'), cleanUndefined({
              userId,
              homeId: scan.homeId,
              roomId: scan.roomId,
              scanId: scan.id,
              title: `Resolved: ${recTitle}`,
              description: `Completed recommendation (+${recImpact} pts). Room safety score is now ${newSafetyScore}.`,
              type: 'improvement',
              timestamp: new Date().toISOString(),
            }));
          }
          return isCompletedNow;
        } catch (error) {
          console.error('Error updating recommendation status:', error);
          return isCompletedNow;
        }
      },

      updateHazardFeedback: async (scanId, hazardId, feedback) => {
        const scan = get().getScanById(scanId);
        if (!scan) return;

        const reviewStatusMap = {
          helpful: 'confirmed',
          not_present: 'disputed',
          needs_review: 'unresolved'
        } as const;

        const updatedHazards = (scan.hazards || []).map((h) => {
          if (h.id === hazardId) {
            return {
              ...h,
              feedback,
              reviewStatus: reviewStatusMap[feedback],
            };
          }
          return h;
        });

        const breakdown = getScoreFormulaBreakdown(updatedHazards);
        const newSafetyScore = breakdown.calculatedScore;

        const updatedScan = {
          ...scan,
          safetyScore: newSafetyScore,
          hazards: updatedHazards,
        };

        set((state) => {
          const newScans = { ...state.scans };
          if (newScans[scan.roomId]) {
            newScans[scan.roomId] = newScans[scan.roomId].map((s) => (s.id === scanId ? updatedScan : s));
          }
          return { scans: newScans };
        });

        try {
          await updateDoc(doc(db, 'scans', scanId), cleanUndefined({
            safetyScore: newSafetyScore,
            hazards: updatedHazards,
          }));
        } catch (error) {
          console.error('Error updating hazard feedback:', error);
        }
      },
    }),
    {
      name: 'scan-storage',
      partialize: (state) => ({ hiddenScans: state.hiddenScans }),
    }
  )
);
