import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment,
  serverTimestamp,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db, cleanUndefined } from '@/lib/firebase';
import { CommunityPost, CommunityComment } from '@/types/home';

interface CommunityState {
  posts: CommunityPost[];
  comments: CommunityComment[];
  subscribePosts: () => () => void;
  subscribeComments: (postId: string) => () => void;
  addPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'commentCount' | 'timestamp'>) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (comment: Omit<CommunityComment, 'id' | 'timestamp'>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  comments: [],

  subscribePosts: () => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as CommunityPost[];
      set({ posts });
    });
  },

  subscribeComments: (postId: string) => {
    const q = query(
      collection(db, 'comments'), 
      where('postId', '==', postId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const postComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as CommunityComment[];
      
      // Update comments in state, merging with others if necessary or just replacing for this post
      set((state) => ({
        comments: [
          ...state.comments.filter(c => c.postId !== postId),
          ...postComments
        ]
      }));
    });
  },

  addPost: async (postData) => {
    await addDoc(collection(db, 'posts'), cleanUndefined({
      ...postData,
      likes: 0,
      commentCount: 0,
      timestamp: serverTimestamp()
    }));
  },

  likePost: async (postId) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, cleanUndefined({
      likes: increment(1)
    }));
  },

  addComment: async (commentData) => {
    await addDoc(collection(db, 'comments'), cleanUndefined({
      ...commentData,
      timestamp: serverTimestamp()
    }));
    
    const postRef = doc(db, 'posts', commentData.postId);
    await updateDoc(postRef, cleanUndefined({
      commentCount: increment(1)
    }));
  },

  deletePost: async (postId) => {
    // Note: In a real app, you'd also delete comments or use a Cloud Function
    await deleteDoc(doc(db, 'posts', postId));
  }
}));
