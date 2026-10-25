import { create } from 'zustand';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => void;
  updateProfile: (profileData: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  signIn: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },

  signInEmail: async (email, password) => {
    console.log('Attempting sign in with:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in result:', result.user.uid);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  signUpEmail: async (email, password, name) => {
    console.log('Attempting sign up with:', email);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      console.log('Sign up result:', user.uid);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
    try {
      localStorage.removeItem('scan-storage');
      localStorage.removeItem('home-storage');
    } catch (e) {
      console.warn('Error clearing storage on logout:', e);
    }
    set({ user: null, profile: null });
  },

  updateProfile: async (profileData) => {
    const { user, profile } = get();
    if (!user) throw new Error("No user logged in");
    const profileRef = doc(db, 'profiles', user.uid);
    await setDoc(profileRef, profileData, { merge: true });
    set({ profile: { ...profile, ...profileData } });
  },

  init: () => {
    console.log('Initializing Auth listener...');
    onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'No user');
      if (user) {
        try {
          const profileRef = doc(db, 'profiles', user.uid);
          let profileSnap = await getDoc(profileRef);
          
          let profile = null;
          if (profileSnap.exists()) {
            profile = profileSnap.data();
          } else {
            console.log('Creating initial profile for:', user.uid);
            // Create initial profile
            profile = {
              name: user.displayName || 'User',
              email: user.email || '',
              avatar: user.photoURL || '',
              role: 'Caregiver',
              ageGroup: '65-74',
              notificationsEnabled: true,
              privacyLevel: 'Private'
            };
            await setDoc(profileRef, profile);
          }
          
          set({ user, profile, loading: false, initialized: true });
        } catch (error: any) {
          console.error('Error fetching profile:', error);
          if (error.code === 'permission-denied') {
            console.error('Permission denied to fetch profile. Check firestore rules.');
          }
          set({ user, profile: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    });
  }
}) );
