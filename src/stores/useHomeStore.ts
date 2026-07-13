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
      const newHome = cleanUndefined({
        ...homeData,
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
    const homeRef = doc(db, 'homes', id);
    await updateDoc(homeRef, cleanUndefined({
      ...homeData,
      updatedAt: new Date().toISOString()
    }));
  },

  deleteHome: async (id) => {
    await deleteDoc(doc(db, 'homes', id));
  },

  addRoom: async (homeId, roomData) => {
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

    const homeRef = doc(db, 'homes', homeId);
    await updateDoc(homeRef, cleanUndefined({
      rooms: [...home.rooms, newRoom],
      updatedAt: new Date().toISOString()
    }));

    await addDoc(collection(db, 'activities'), cleanUndefined({
      userId: home.userId,
      homeId,
      action: 'Added Room',
      description: `Added ${newRoom.name} to the home`,
      timestamp: new Date().toISOString()
    }));
  },

  updateRoom: async (homeId, roomId, roomData) => {
    const home = get().homes.find(h => h.id === homeId);
    if (!home) return;

    const updatedRooms = home.rooms.map(r => 
      r.id === roomId ? { ...r, ...roomData, updatedAt: new Date().toISOString() } : r
    );

    const homeRef = doc(db, 'homes', homeId);
    await updateDoc(homeRef, cleanUndefined({
      rooms: updatedRooms,
      updatedAt: new Date().toISOString()
    }));
  },

  deleteRoom: async (homeId, roomId) => {
    const home = get().homes.find(h => h.id === homeId);
    if (!home) return;

    const updatedRooms = home.rooms.filter(r => r.id !== roomId);

    const homeRef = doc(db, 'homes', homeId);
    await updateDoc(homeRef, cleanUndefined({
      rooms: updatedRooms,
      updatedAt: new Date().toISOString()
    }));
  },

  addImage: async (homeId, roomId, imageData) => {
    const home = get().homes.find(h => h.id === homeId);
    if (!home) return;

    const newImage: RoomImage = {
      ...imageData,
      id: `img-${Date.now()}`,
      roomId,
      uploadedAt: new Date().toISOString()
    };

    const updatedRooms = home.rooms.map(r => {
      if (r.id === roomId) {
        return { ...r, images: [...r.images, newImage], updatedAt: new Date().toISOString() };
      }
      return r;
    });

    const homeRef = doc(db, 'homes', homeId);
    await updateDoc(homeRef, cleanUndefined({
      rooms: updatedRooms,
      updatedAt: new Date().toISOString()
    }));

    await addDoc(collection(db, 'activities'), cleanUndefined({
      userId: home.userId,
      homeId,
      action: 'Uploaded Image',
      description: `Added a new image to one of the rooms`,
      timestamp: new Date().toISOString()
    }));
  },

  deleteImage: async (homeId, roomId, imageId) => {
    const home = get().homes.find(h => h.id === homeId);
    if (!home) return;

    const updatedRooms = home.rooms.map(r => {
      if (r.id === roomId) {
        return { ...r, images: r.images.filter(img => img.id !== imageId), updatedAt: new Date().toISOString() };
      }
      return r;
    });

    const homeRef = doc(db, 'homes', homeId);
    await updateDoc(homeRef, cleanUndefined({
      rooms: updatedRooms,
      updatedAt: new Date().toISOString()
    }));
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
