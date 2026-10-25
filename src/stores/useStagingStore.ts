import { create } from 'zustand';
import { StagedPhoto, RoomType } from '@/types/home';
import { db, auth, cleanUndefined, handleFirestoreError, OperationType } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
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

  deletePhoto: async (photoId: string) => {
    console.log('Attempting to delete staged photo:', photoId);
    const state = get();
    const existingIndex = state.photos.findIndex((p) => p.id === photoId);
    if (existingIndex === -1) return;
    const existing = state.photos[existingIndex];

    const isSample = 
      Boolean((existing as any)?.isSample) || 
      photoId.startsWith('sample-') || 
      photoId.startsWith('demo-');

    // Snapshot current state for rollback if server deletion fails
    const previousPhotos = [...state.photos];

    // 1. Optimistically remove from local state immediately so UI updates responsively
    set({ photos: state.photos.filter((p) => p.id !== photoId) });

    // 2. If it is a demo or sample item, remove only locally without issuing privileged Firestore mutations
    if (isSample) {
      console.log('Sample photo removed from local session:', photoId);
      return;
    }

    // 3. Ownership security check
    const currentUid = auth.currentUser?.uid;
    if (existing.userId && currentUid && existing.userId !== currentUid) {
      // Revert optimistic removal
      set({ photos: previousPhotos });
      throw new Error("Permission Denied: You do not have permission to delete this photo.");
    }

    // 4. Best-effort Firebase Storage object cleanup
    if (existing.imageUrl) {
      deleteImageFromStorage(existing.imageUrl).catch((err) => {
        console.warn('Storage cleanup warning:', err);
      });
    }

    // 5. Cloud Firestore deletion with rollback on error
    try {
      await deleteDoc(doc(db, 'stagedPhotos', photoId));
      console.log('Photo deleted successfully from Firestore:', photoId);
    } catch (error) {
      console.error('Firestore deletion failed, rolling back optimistic removal:', error);
      // Restore photo in state so the user never has a phantom deletion
      set({ photos: previousPhotos });
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
