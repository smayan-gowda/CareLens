import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EvidenceReview,
  EvidenceReviewStatus,
  Recommendation,
  RecommendationActionStatus,
  ScanPipelineTrace,
  ScanResult,
  SpatialFinding,
  SpatialFindingReviewStatus,
} from '@/types/ai';
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
import { appendRecommendationAction, type RecommendationActionDetails } from '@/utils/recommendationActions';
import { processImageForStorage } from '@/services/storageService';
import { getScoreFormulaBreakdown } from '@/components/reports/reportMath';

type ScanToPersist = Omit<ScanResult, 'id'> & { id?: string };

interface ScanState {
  scans: Record<string, ScanResult[]>;
  hiddenScans: string[];
  hideScan: (scanId: string) => void;
  loading: boolean;
  
  // Subscription management
  subscribe: (userId: string) => () => void;
  
  addScan: (userId: string, roomId: string, scan: ScanToPersist) => Promise<void>;
  recordPipelineTrace: (userId: string, trace: ScanPipelineTrace) => Promise<void>;
  deleteScan: (roomId: string, scanId: string) => Promise<void>;
  getScansForRoom: (roomId: string) => ScanResult[];
  getScanById: (scanId: string) => ScanResult | undefined;
  updateRecommendationAction: (
    scanId: string,
    recommendationId: string,
    status: RecommendationActionStatus,
    details?: RecommendationActionDetails
  ) => Promise<void>;
  updateHazardFeedback: (
    scanId: string,
    hazardId: string,
    feedback: 'helpful' | 'not_present' | 'needs_review'
  ) => Promise<EvidenceReview | undefined>;
  updateSpatialFindingReview: (
    scanId: string,
    findingId: string,
    reviewStatus: Exclude<SpatialFindingReviewStatus, 'unreviewed'>,
    findings: SpatialFinding[]
  ) => Promise<EvidenceReview | undefined>;
}

function createEvidenceReview(
  targetType: EvidenceReview['targetType'],
  targetId: string,
  status: EvidenceReviewStatus,
  imageId?: string
): EvidenceReview {
  return {
    id: `review-${crypto.randomUUID()}`,
    targetType,
    targetId,
    status,
    origin: 'user',
    reviewedAt: new Date().toISOString(),
    imageId,
  };
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
        const scanId = scanData.id || `scan-${Date.now()}`;
        let images = scanData.images 
          ? await Promise.all(scanData.images.map(img => processImageForStorage(img)))
          : scanData.images;
        const pipelineTrace = scanData.pipelineTrace
          ? { ...scanData.pipelineTrace, persistenceStatus: 'saved' as const }
          : undefined;

        let newScan = cleanUndefined({
          ...scanData,
          pipelineTrace,
          assessmentTrace: scanData.assessmentTrace && pipelineTrace
            ? { ...scanData.assessmentTrace, pipeline: pipelineTrace }
            : scanData.assessmentTrace,
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

      recordPipelineTrace: async (userId, trace) => {
        if (trace.status !== 'failed') {
          throw new Error('Only failed scan pipeline traces can be stored without a report.');
        }
        try {
          await setDoc(doc(db, 'scanPipelineTraces', trace.scanId), cleanUndefined({
            userId,
            ...trace,
          }));
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'scanPipelineTraces');
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

      updateRecommendationAction: async (
        scanId,
        recommendationId,
        status,
        details: RecommendationActionDetails = {}
      ) => {
        const scan = get().getScanById(scanId);
        if (!scan) throw new Error('Assessment not found for this action.');

        const target = scan.recommendations?.find((recommendation) => recommendation.id === recommendationId);
        if (!target) throw new Error('Recommendation not found in this assessment.');
        const updatedRecommendations = scan.recommendations.map((recommendation) =>
          recommendation.id === recommendationId
            ? appendRecommendationAction(recommendation, status, details)
            : recommendation
        );
        const updatedScan = { ...scan, recommendations: updatedRecommendations };

        set((state) => {
          const newScans = { ...state.scans };
          if (newScans[scan.roomId]) {
            newScans[scan.roomId] = newScans[scan.roomId].map((s) => (s.id === scanId ? updatedScan : s));
          }
          return { scans: newScans };
        });

        try {
          await updateDoc(doc(db, 'scans', scanId), cleanUndefined({
            recommendations: updatedRecommendations,
          }));
        } catch (error) {
          set((state) => {
            const newScans = { ...state.scans };
            if (newScans[scan.roomId]) {
              newScans[scan.roomId] = newScans[scan.roomId].map((item) =>
                item.id === scanId ? scan : item
              );
            }
            return { scans: newScans };
          });
          console.error('Error updating recommendation status:', error);
          throw error;
        }
      },

      updateHazardFeedback: async (scanId, hazardId, feedback) => {
        const scan = get().getScanById(scanId);
        if (!scan) return undefined;

        const reviewStatusMap = {
          helpful: 'confirmed',
          not_present: 'disputed',
          needs_review: 'needs_review'
        } as const;

        const targetHazard = (scan.hazards || []).find((hazard) => hazard.id === hazardId);
        if (!targetHazard) return undefined;
        const review = createEvidenceReview(
          'hazard',
          hazardId,
          reviewStatusMap[feedback],
          targetHazard.imageId
        );
        const updatedHazards = (scan.hazards || []).map((h) => {
          if (h.id === hazardId) {
            return {
              ...h,
              feedback,
              reviewStatus: reviewStatusMap[feedback],
              reviewIds: [...(h.reviewIds ?? []), review.id],
            };
          }
          return h;
        });
        const updatedReviews = [...(scan.evidenceReviews ?? []), review];

        const breakdown = getScoreFormulaBreakdown(updatedHazards);
        const newSafetyScore = breakdown.calculatedScore;

        const updatedScan = {
          ...scan,
          safetyScore: newSafetyScore,
          hazards: updatedHazards,
          evidenceReviews: updatedReviews,
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
            evidenceReviews: updatedReviews,
          }));
          return review;
        } catch (error) {
          set((state) => {
            const newScans = { ...state.scans };
            if (newScans[scan.roomId]) {
              newScans[scan.roomId] = newScans[scan.roomId].map((item) =>
                item.id === scanId ? scan : item
              );
            }
            return { scans: newScans };
          });
          console.error('Error updating hazard feedback:', error);
          throw error;
        }
      },

      updateSpatialFindingReview: async (scanId, findingId, reviewStatus, findings) => {
        const scan = get().getScanById(scanId);
        if (!scan) return undefined;

        const currentFindings = scan.spatialFindings ?? findings;
        const previousFinding = currentFindings.find((finding) => finding.id === findingId);
        if (!previousFinding) return undefined;

        const review = createEvidenceReview(
          'spatial-finding',
          findingId,
          reviewStatus,
          previousFinding.imageId
        );
        const updatedFindings = currentFindings.map((finding) =>
          finding.id === findingId
            ? { ...finding, reviewStatus, reviewIds: [...(finding.reviewIds ?? []), review.id] }
            : finding
        );
        const updatedReviews = [...(scan.evidenceReviews ?? []), review];
        const updatedScan = {
          ...scan,
          spatialFindings: updatedFindings,
          evidenceReviews: updatedReviews,
        };

        set((state) => {
          const newScans = { ...state.scans };
          if (newScans[scan.roomId]) {
            newScans[scan.roomId] = newScans[scan.roomId].map((item) =>
              item.id === scanId ? updatedScan : item
            );
          }
          return { scans: newScans };
        });

        try {
          await updateDoc(
            doc(db, 'scans', scanId),
            cleanUndefined({
              spatialFindings: updatedFindings,
              evidenceReviews: updatedReviews,
            })
          );
          return review;
        } catch (error) {
          set((state) => {
            const newScans = { ...state.scans };
            if (newScans[scan.roomId]) {
              newScans[scan.roomId] = newScans[scan.roomId].map((item) => {
                if (item.id !== scanId) return item;
                return {
                  ...item,
                  evidenceReviews: scan.evidenceReviews,
                  spatialFindings: currentFindings.map((finding) =>
                    finding.id === findingId
                      ? { ...finding, reviewStatus: previousFinding.reviewStatus }
                      : finding
                  ),
                };
              });
            }
            return { scans: newScans };
          });
          console.error('Error updating spatial finding review:', error);
          throw error;
        }
      },
    }),
    {
      name: 'scan-storage',
      partialize: (state) => ({ hiddenScans: state.hiddenScans }),
    }
  )
);
