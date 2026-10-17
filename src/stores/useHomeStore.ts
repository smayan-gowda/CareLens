import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Home, 
  Room, 
  RoomImage, 
  Activity, 
  TimelineEvent, 
  Notification 
} from '@/types/home';
import { db, handleFirestoreError, OperationType, cleanUndefined } from '@/lib/firebase';
import { compressImageDataUrl } from '@/utils/imageCompression';
import { processImageForStorage, deleteImageFromStorage } from '@/services/storageService';
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
  getDocs
} from 'firebase/firestore';

async function sanitizeRoom(r: Room): Promise<Room> {
  const coverImage = r.coverImage ? await processImageForStorage(r.coverImage) : undefined;
  
  const recentImages = r.images || [];
  const processedImages = await Promise.all(
    recentImages.map(async (img) => ({
      ...img,
      url: await processImageForStorage(img.url),
    }))
  );

  return {
    ...r,
    coverImage,
    images: processedImages,
  };
}

async function sanitizeHome(homeData: Partial<Home>): Promise<Partial<Home>> {
  let coverImage = homeData.coverImage ? await processImageForStorage(homeData.coverImage) : undefined;
  let rooms = homeData.rooms;
  if (rooms) {
    rooms = await Promise.all(rooms.map(r => sanitizeRoom(r)));
  }

  let result: Partial<Home> = {
    ...homeData,
    coverImage,
    ...(rooms ? { rooms } : {}),
  };

  // Firestore hard document limit is 1,048,576 bytes (~1.048 MB). Target ceiling: 750,000 bytes.
  const FIRESTORE_MAX_BYTES = 750000;

  let strLen = JSON.stringify(result).length;

  // Gradual compression tiers ONLY for unhosted local base64 fallback images if document exceeds safe size
  const tiers = [
    { maxDim: 1600, quality: 0.82, targetKB: 200 },
    { maxDim: 1280, quality: 0.75, targetKB: 120 },
    { maxDim: 800, quality: 0.65, targetKB: 70 },
  ];

  for (const tier of tiers) {
    if (strLen <= FIRESTORE_MAX_BYTES) break;

    if (result.rooms) {
      result.rooms = await Promise.all(
        result.rooms.map(async (r) => {
          const compressed = await Promise.all(
            (r.images || []).map(async (img) => {
              // NEVER compress or touch hosted HTTP/HTTPS URLs (e.g. Firebase or Supabase Storage)
              if (!img.url || img.url.startsWith("http://") || img.url.startsWith("https://")) {
                return img;
              }
              return {
                ...img,
                url: await compressImageDataUrl(img.url, tier.maxDim, tier.maxDim, tier.quality, tier.targetKB, true),
              };
            })
          );
          return {
            ...r,
            coverImage: r.coverImage && !r.coverImage.startsWith("http") ? await compressImageDataUrl(r.coverImage, tier.maxDim, tier.maxDim, tier.quality, tier.targetKB, true) : r.coverImage,
            images: compressed,
          };
        })
      );
    }

    if (result.coverImage && !result.coverImage.startsWith("http")) {
      result.coverImage = await compressImageDataUrl(result.coverImage, tier.maxDim, tier.maxDim, tier.quality, tier.targetKB, true);
    }

    strLen = JSON.stringify(result).length;
  }

  // Safety fallback if document size is still > 750KB due to many raw base64 images
  if (strLen > FIRESTORE_MAX_BYTES && result.rooms) {
    result.rooms = result.rooms.map((r) => ({
      ...r,
      images: (r.images || []).filter(img => img.url.startsWith("http")).concat(
        (r.images || []).filter(img => !img.url.startsWith("http")).slice(-2)
      )
    }));
  }

  return result;
}

interface HomeStore {
  homes: Home[];
  hiddenHomes: string[];
  hideHome: (id: string) => void;
  hiddenRooms: string[];
  hideRoom: (id: string) => void;
  activities: Activity[];
  timelineEvents: TimelineEvent[];
  notifications: Notification[];
  loading: boolean;
  
  // Subscription management
  subscribe: (userId: string) => () => void;
  
  // Home Actions
  addHome: (userId: string, home: Omit<Home, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'rooms'>) => Promise<void>;
  updateHome: (id: string, home: Partial<Home>) => Promise<void>;
  deleteHome: (id: string) => Promise<void>;
  
  // Room Actions
  addRoom: (homeId: string, room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'homeId'>) => Promise<void>;
  updateRoom: (homeId: string, roomId: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (homeId: string, roomId: string) => Promise<void>;

  // Image Actions
  addImage: (homeId: string, roomId: string, image: Omit<RoomImage, 'id' | 'uploadedAt' | 'roomId'>) => Promise<void>;
  deleteImage: (homeId: string, roomId: string, imageId: string) => Promise<void>;

  // Activity & Timeline Actions
  addActivity: (userId: string, activity: Omit<Activity, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  addTimelineEvent: (userId: string, event: Omit<TimelineEvent, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  
  // Notification Actions
  addNotification: (userId: string, notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'isRead'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: (userId: string) => Promise<void>;
}

export const useHomeStore = create<HomeStore>()(
  persist(
    (set, get) => ({
      homes: [],
      hiddenHomes: [],
      hiddenRooms: [],
      hideRoom: (id) => set((state) => ({ hiddenRooms: [...state.hiddenRooms, id] })),

      hideHome: (id) => set((state) => ({ hiddenHomes: [...state.hiddenHomes, id] })),

  activities: [],
  timelineEvents: [],
  notifications: [],
  loading: false,

  subscribe: (userId: string) => {
    set({ loading: true });
    
    // Subscribe to homes
    const homesQuery = query(collection(db, 'homes'), where('userId', '==', userId), orderBy('updatedAt', 'desc'));
    const unsubHomes = onSnapshot(homesQuery, (snapshot) => {
      const homes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Home));
      set({ homes, loading: false });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'homes');
    });

    // Subscribe to activities
    const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      set({ activities });
    });

    // Subscribe to timeline events
    const timelineQuery = query(collection(db, 'timelineEvents'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const unsubTimeline = onSnapshot(timelineQuery, (snapshot) => {
      const timelineEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineEvent));
      set({ timelineEvents });
    });

    // Subscribe to notifications
    const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      set({ notifications });
    });

    return () => {
      unsubHomes();
      unsubActivities();
      unsubTimeline();
      unsubNotifications();
    };
  },

  addHome: async (userId, homeData) => {
    try {
      const sanitized = await sanitizeHome(homeData);
      const newHome = cleanUndefined({
        ...sanitized,
        userId,
        rooms: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const docRef = await addDoc(collection(db, 'homes'), newHome);
      
      await addDoc(collection(db, 'activities'), cleanUndefined({
        userId,
        homeId: docRef.id,
        action: 'Created Home',
        description: `Created new home profile for ${homeData.name}`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'homes');
    }
  },

  updateHome: async (id, homeData) => {
    try {
      const home = get().homes.find(h => h.id === id);

      // Delete old cover photo if replaced with a new one
      if (home && home.coverImage && homeData.coverImage && home.coverImage !== homeData.coverImage) {
        deleteImageFromStorage(home.coverImage).catch((err) =>
          console.warn("Error deleting replaced home cover:", err)
        );
      }

      const merged = home ? { ...home, ...homeData } : homeData;
      const sanitized = await sanitizeHome(merged);

      // Optimistic update
      set(state => ({
        homes: state.homes.map(h => h.id === id ? { ...h, ...sanitized } as Home : h)
      }));

      const homeRef = doc(db, 'homes', id);
      await updateDoc(homeRef, cleanUndefined({
        ...sanitized,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `homes/${id}`);
    }
  },

  deleteHome: async (id) => {
    try {
      const home = get().homes.find(h => h.id === id);
      if (home) {
        if (home.coverImage) deleteImageFromStorage(home.coverImage).catch(() => {});
        if (home.rooms) {
          for (const room of home.rooms) {
            if (room.coverImage) deleteImageFromStorage(room.coverImage).catch(() => {});
            if (room.images) {
              for (const img of room.images) {
                if (img.url) deleteImageFromStorage(img.url).catch(() => {});
              }
            }
          }
        }
      }

      set(state => ({ homes: state.homes.filter(h => h.id !== id) }));
      await deleteDoc(doc(db, 'homes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `homes/${id}`);
    }
  },

  addRoom: async (homeId, roomData) => {
    try {
      const home = get().homes.find(h => h.id === homeId);
      if (!home) return;

      const newRoom: Room = {
        ...roomData,
        id: `room-${Date.now()}`,
        homeId,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sanitized = await sanitizeHome({
        ...home,
        rooms: [...(home.rooms || []), newRoom],
      });

      // Optimistic update
      set(state => ({
        homes: state.homes.map(h => h.id === homeId ? { ...h, ...sanitized } as Home : h)
      }));

      const homeRef = doc(db, 'homes', homeId);
      await updateDoc(homeRef, cleanUndefined({
        ...sanitized,
        updatedAt: new Date().toISOString()
      }));

      await addDoc(collection(db, 'activities'), cleanUndefined({
        userId: home.userId,
        homeId,
        action: 'Added Room',
        description: `Added ${roomData.name} to the home`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `homes/${homeId}/addRoom`);
    }
  },

  updateRoom: async (homeId, roomId, roomData) => {
    try {
      const home = get().homes.find(h => h.id === homeId);
      if (!home) return;

      const currentRoom = home.rooms?.find(r => r.id === roomId);
      // Delete old cover photo if replaced with a new one
      if (currentRoom && currentRoom.coverImage && roomData.coverImage && currentRoom.coverImage !== roomData.coverImage) {
        deleteImageFromStorage(currentRoom.coverImage).catch((err) =>
          console.warn("Error deleting replaced room cover:", err)
        );
      }

      const updatedRooms = (home.rooms || []).map((r) => {
        if (r.id === roomId) {
          return { ...r, ...roomData, updatedAt: new Date().toISOString() };
        }
        return r;
      });

      const sanitized = await sanitizeHome({
        ...home,
        rooms: updatedRooms,
      });

      // Optimistic update
      set(state => ({
        homes: state.homes.map(h => h.id === homeId ? { ...h, ...sanitized } as Home : h)
      }));

      const homeRef = doc(db, 'homes', homeId);
      await updateDoc(homeRef, cleanUndefined({
        ...sanitized,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `homes/${homeId}/updateRoom`);
    }
  },

  deleteRoom: async (homeId, roomId) => {
    try {
      const home = get().homes.find(h => h.id === homeId);
      if (!home) return;

      const roomToDelete = home.rooms?.find(r => r.id === roomId);
      if (roomToDelete) {
        if (roomToDelete.coverImage) deleteImageFromStorage(roomToDelete.coverImage).catch(() => {});
        if (roomToDelete.images) {
          for (const img of roomToDelete.images) {
            if (img.url) deleteImageFromStorage(img.url).catch(() => {});
          }
        }
      }

      const updatedRooms = (home.rooms || []).filter(r => r.id !== roomId);

      const sanitized = await sanitizeHome({
        ...home,
        rooms: updatedRooms,
      });

      // Optimistic update
      set(state => ({
        homes: state.homes.map(h => h.id === homeId ? { ...h, ...sanitized } as Home : h)
      }));

      const homeRef = doc(db, 'homes', homeId);
      await updateDoc(homeRef, cleanUndefined({
        ...sanitized,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `homes/${homeId}/deleteRoom`);
    }
  },

  addImage: async (homeId, roomId, imageData) => {
    try {
      const home = get().homes.find(h => h.id === homeId);
      if (!home) return;

      const processedUrl = await processImageForStorage(imageData.url);

      const newImage: RoomImage = {
        ...imageData,
        url: processedUrl,
        id: `img-${Date.now()}`,
        roomId,
        uploadedAt: new Date().toISOString()
      };

      const updatedRooms = (home.rooms || []).map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            images: [...(r.images || []), newImage],
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });

      const sanitized = await sanitizeHome({
        ...home,
        rooms: updatedRooms,
      });

      // Optimistic update
      set(state => ({
        homes: state.homes.map(h => h.id === homeId ? { ...h, ...sanitized } as Home : h)
      }));

      const homeRef = doc(db, 'homes', homeId);
      await updateDoc(homeRef, cleanUndefined({
        ...sanitized,
        updatedAt: new Date().toISOString()
      }));

      await addDoc(collection(db, 'activities'), cleanUndefined({
        userId: home.userId,
        homeId,
        action: 'Uploaded Image',
        description: `Added a new image to one of the rooms`,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `homes/${homeId}/addImage`);
    }
  },

  deleteImage: async (homeId, roomId, imageId) => {
    try {
      const home = get().homes.find(h => h.id === homeId);
      if (!home) return;

      const room = home.rooms?.find(r => r.id === roomId);
      const imgToDelete = room?.images?.find(i => i.id === imageId);
      if (imgToDelete?.url) {
        deleteImageFromStorage(imgToDelete.url).catch(err => console.warn("Error deleting image from storage:", err));
      }

      const updatedRooms = (home.rooms || []).map(r => {
        if (r.id === roomId) {
          return { ...r, images: (r.images || []).filter(img => img.id !== imageId), updatedAt: new Date().toISOString() };
        }
        return r;
      });

      const sanitized = await sanitizeHome({
        ...home,
        rooms: updatedRooms,
      });

      // Optimistic update
      set(state => ({
        homes: state.homes.map(h => h.id === homeId ? { ...h, ...sanitized } as Home : h)
      }));

      const homeRef = doc(db, 'homes', homeId);
      await updateDoc(homeRef, cleanUndefined({
        ...sanitized,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `homes/${homeId}/deleteImage`);
    }
  },

  addActivity: async (userId, activityData) => {
    await addDoc(collection(db, 'activities'), cleanUndefined({
      ...activityData,
      userId,
      timestamp: new Date().toISOString()
    }));
  },

  addTimelineEvent: async (userId, eventData) => {
    await addDoc(collection(db, 'timelineEvents'), cleanUndefined({
      ...eventData,
      userId,
      timestamp: new Date().toISOString()
    }));
  },

  addNotification: async (userId, notificationData) => {
    await addDoc(collection(db, 'notifications'), cleanUndefined({
      ...notificationData,
      userId,
      isRead: false,
      timestamp: new Date().toISOString()
    }));
  },

  markNotificationRead: async (id) => {
    const notificationRef = doc(db, 'notifications', id);
    await updateDoc(notificationRef, { isRead: true });
  },

  clearNotifications: async (userId) => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
    }
  },
    }),
    {
      name: 'home-storage',
      partialize: (state) => ({ 
        hiddenHomes: state.hiddenHomes, 
        hiddenRooms: state.hiddenRooms 
      }),
    }
  )
);
