import { create } from 'zustand';
import { StagedPhoto, RoomType } from '@/types/home';
import { db, cleanUndefined, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy 
} from 'firebase/firestore';
import { processImageForStorage, deleteImageFromStorage } from '@/services/storageService';

interface StagingState {
  photos: StagedPhoto[];
  loading: boolean;
  selectedFilterRoom: string;
  selectedFilterStatus: 'all' | 'unscanned' | 'scanned';
  setSelectedFilterRoom: (room: string) => void;
  setSelectedFilterStatus: (status: 'all' | 'unscanned' | 'scanned') => void;
  
  // Real-time synchronization
  subscribe: (userId: string) => () => void;
  
  // Actions
  addPhoto: (
    userId: string, 
    data: {
      fileOrUrl: File | string;
      homeId: string;
      roomId?: string;
      roomType: RoomType;
      title: string;
      notes?: string;
      capturedFrom?: 'mobile' | 'desktop';
    }
  ) => Promise<string>;
  
  updatePhoto: (
    photoId: string, 
    updates: {
      title?: string;
      notes?: string;
      roomType?: RoomType;
      roomId?: string;
      homeId?: string;
    }
  ) => Promise<void>;
  
  deletePhoto: (photoId: string) => Promise<void>;
  markScanned: (photoId: string, scanId: string) => Promise<void>;
  getPhotoById: (photoId: string) => StagedPhoto | undefined;
}

export const useStagingStore = create<StagingState>((set, get) => ({
  photos: [],
  loading: false,
  selectedFilterRoom: 'all',
  selectedFilterStatus: 'all',
  
  setSelectedFilterRoom: (room) => set({ selectedFilterRoom: room }),
  setSelectedFilterStatus: (status) => set({ selectedFilterStatus: status }),

  subscribe: (userId: string) => {
    if (!userId) return () => {};
    set({ loading: true });

    const q = query(
      collection(db, 'stagedPhotos'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const loaded: StagedPhoto[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<StagedPhoto, 'id'>)
        }));
        set({ photos: loaded, loading: false });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'stagedPhotos');
        set({ loading: false });
      }
    );

    return unsub;
  },

  addPhoto: async (userId, { fileOrUrl, homeId, roomId, roomType, title, notes, capturedFrom = 'mobile' }) => {
    try {
      const processedUrl = await processImageForStorage(fileOrUrl);
      if (!processedUrl) {
        throw new Error('Failed to process image');
      }

      const now = new Date().toISOString();
      const payload: Omit<StagedPhoto, 'id'> = {
        userId,
        homeId,
        roomId: roomId || '',
        roomType,
        title: title.trim() || `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Photo`,
        notes: notes?.trim() || '',
        imageUrl: processedUrl,
        status: 'unscanned',
        capturedFrom,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'stagedPhotos'), cleanUndefined(payload));
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stagedPhotos');
      throw error;
    }
  },

  updatePhoto: async (photoId, updates) => {
    try {
      const photoRef = doc(db, 'stagedPhotos', photoId);
      const payload = cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await updateDoc(photoRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stagedPhotos/${photoId}`);
      throw error;
    }
  },

  deletePhoto: async (photoId) => {
    try {
      const existing = get().photos.find((p) => p.id === photoId);
      if (existing?.imageUrl) {
        deleteImageFromStorage(existing.imageUrl).catch(() => {});
      }
      await deleteDoc(doc(db, 'stagedPhotos', photoId));
      set((state) => ({ photos: state.photos.filter((p) => p.id !== photoId) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stagedPhotos/${photoId}`);
      throw error;
    }
  },

  markScanned: async (photoId, scanId) => {
    try {
      const photoRef = doc(db, 'stagedPhotos', photoId);
      await updateDoc(photoRef, {
        status: 'scanned',
        scanId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stagedPhotos/${photoId}`);
      throw error;
    }
  },

  getPhotoById: (photoId) => get().photos.find((p) => p.id === photoId)
}));
