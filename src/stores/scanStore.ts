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
        
        const scansQuery = query(collection(db, 'scans'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        
        const unsub = onSnapshot(scansQuery, (snapshot) => {
          const scansMap: Record<string, ScanResult[]> = {};
          
          snapshot.docs.forEach(doc => {
            const scan = { id: doc.id, ...doc.data() } as ScanResult;
            if (!scansMap[scan.roomId]) {
              scansMap[scan.roomId] = [];
            }
            scansMap[scan.roomId].push(scan);
          });
          
          set({ scans: scansMap, loading: false });
        }, (error) => {
          console.error('Error subscribing to scans:', error);
          set({ loading: false });
        });

        return unsub;
      },

      addScan: async (userId, roomId, scanData) => {
        const scanId = (scanData as any).id || `scan-${Date.now()}`;
        const newScan = cleanUndefined({
          ...scanData,
          id: scanId,
          userId,
          roomId,
          createdAt: new Date().toISOString()
        });
        try {
          await setDoc(doc(db, 'scans', scanId), newScan);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'scans');
        }
      },

      deleteScan: async (roomId, scanId) => {
        try {
          const userId = auth.currentUser?.uid;

          // Find any documents in firestore scans collection where the 'id' field matches the given scanId
          const q = query(collection(db, 'scans'), where('id', '==', scanId));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            for (const document of querySnapshot.docs) {
              await deleteDoc(doc(db, 'scans', document.id));
            }
          } else {
            // Fallback: try deleting by the ID directly
            await deleteDoc(doc(db, 'scans', scanId));
          }

          if (userId) {
            // 1. Clean up associated timelineEvents (by scanId)
            const timelineQuery = query(
              collection(db, 'timelineEvents'),
              where('userId', '==', userId),
              where('scanId', '==', scanId)
            );
            const timelineSnapshot = await getDocs(timelineQuery);
            for (const document of timelineSnapshot.docs) {
              await deleteDoc(doc(db, 'timelineEvents', document.id));
            }

            // Fallback check by link for timelineEvents (e.g., pre-existing or old scans without scanId)
            try {
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
              console.warn('Error cleaning up timeline events by link:', e);
            }

            // 2. Clean up associated notifications (by scanId)
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
            try {
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
              console.warn('Error cleaning up notifications by link:', e);
            }

            // 3. Clean up associated activities (by scanId)
            const activitiesQuery = query(
              collection(db, 'activities'),
              where('userId', '==', userId),
              where('scanId', '==', scanId)
            );
            const activitiesSnapshot = await getDocs(activitiesQuery);
            for (const document of activitiesSnapshot.docs) {
              await deleteDoc(doc(db, 'activities', document.id));
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
    }),
    {
      name: 'scan-storage',
      partialize: (state) => ({ hiddenScans: state.hiddenScans }),
    }
  )
);
