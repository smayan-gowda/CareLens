import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, 
  Search, 
  Heart,
  Loader2,
  Send,
  Sparkles
} from "lucide-react";
import { useCommunityStore } from '@/stores/useCommunityStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { CommunityPost } from '@/types/home';

const HERO_IMAGE = "https://images.unsplash.com/photo-1758273241078-8eec353836be?q=80&w=2400&auto=format&fit=crop";

export function CommunityPage() {
  const { posts, comments, addPost, subscribePosts, subscribeComments, likePost, likeComment, addComment } = useCommunityStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // New Discussion state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'General' as any
  });

  // Post Detail / Comments state
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedPulse, setLikedPulse] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePosts();
    return () => unsubscribe();
  }, [subscribePosts]);

  useEffect(() => {
    if (selectedPost) {
      const unsubscribe = subscribeComments(selectedPost.id);
      return () => unsubscribe();
    }
  }, [selectedPost, subscribeComments]);

  const categories = ['All', 'Home Safety', 'Caregiving', 'Accessibility', 'Technology', 'General'];

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [posts]
  );

  // The most-discussed recent post, curated as a single featured entry —
  // not an algorithmic ranking, just "the conversation most worth reading."
  const featuredPost = useMemo(() => {
    if (sortedPosts.length === 0) return null;
    return [...sortedPosts].sort((a, b) => (b.likes + b.commentCount * 2) - (a.likes + a.commentCount * 2))[0];
  }, [sortedPosts]);

  const filteredPosts = sortedPosts.filter(post =>
    post.id !== featuredPost?.id &&
    (activeCategory === 'All' || post.category === activeCategory) &&
    (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateDiscussion = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPost({
        authorId: user?.uid || 'anonymous',
        authorName: user?.displayName || 'Anonymous User',
        authorAvatar: user?.photoURL || undefined,
        category: newPost.category,
        title: newPost.title,
        content: newPost.content,
      });
      setIsDialogOpen(false);
      setNewPost({ title: '', content: '', category: 'General' });
      toast.success('Shared with the community');
    } catch (error) {
      console.error('Failed to create post', error);
      toast.error('Failed to create discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    setLikedPulse(postId);
    setTimeout(() => setLikedPulse(null), 400);
    try {
      await likePost(postId, user.uid);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    try {
      await likeComment(commentId, user.uid);
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    setIsSubmittingComment(true);
    try {
      await addComment({
        postId: selectedPost.id,
        authorId: user?.uid || 'anonymous',
        authorName: user?.displayName || 'Anonymous User',
        authorAvatar: user?.photoURL || undefined,
        content: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const currentComments = comments.filter(c => c.postId === selectedPost?.id);

  const openComposer = () => setIsDialogOpen(true);

  return (
    <div>
      {/* ===== Hero — warm, editorial, photographic ===== */}
      <div className="relative w-screen left-1/2 -ml-[50vw] h-[46vh] min-h-[340px] overflow-hidden bg-neutral-900 photo-vignette -mt-8 md:-mt-10">
        <img src={HERO_IMAGE} alt="" className="w-full h-full object-cover" />
        <div className="relative z-10 h-full flex flex-col justify-end px-5 md:px-10 pb-12 md:pb-14 max-w-[1200px] mx-auto">
          <span className="field-tag text-white/50 mb-4 block">Caregiver Network</span>
          <h1 className="narrative text-white text-5xl md:text-7xl text-balance mb-3">Community wisdom.</h1>
          <p className="text-white/65 text-base md:text-lg max-w-lg">Learn from caregivers facing the same challenges — and share what you've learned along the way.</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-10 md:pt-14">
        {/* ===== Composer entry point — inviting, not a small button ===== */}
        <button
          onClick={openComposer}
          className="w-full flex items-center gap-4 text-left py-5 px-6 border border-border hover:border-brand/40 transition-colors mb-10 group"
        >
          <Avatar className="h-10 w-10 rounded-full border border-border shrink-0">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="rounded-full">{(user?.displayName || 'A').substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">
            What would you like to share today?
          </span>
        </button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-md p-8 border border-border">
            <DialogHeader className="mb-6">
              <DialogTitle className="narrative text-3xl">What's on your mind?</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Share your experience or ask a question — someone here has likely faced it too.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="field-tag text-muted-foreground">Category</Label>
                <Select
                  value={newPost.category}
                  onValueChange={(val: any) => setNewPost({ ...newPost, category: val })}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border border-border shadow-xl">
                    {categories.filter(c => c !== 'All').map(cat => (
                      <SelectItem key={cat} value={cat} className="py-3 rounded-md">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="field-tag text-muted-foreground">Title</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="e.g. Recommendations for bathroom grab bars?"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="field-tag text-muted-foreground">Message</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Describe your situation or question..."
                  className="min-h-[150px] resize-none"
                />
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button variant="brand" onClick={handleCreateDiscussion} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Share with community
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== Featured discussion — curated, not algorithmic ===== */}
        {featuredPost && activeCategory === 'All' && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setSelectedPost(featuredPost)}
            className="mb-14 cursor-pointer group"
          >
            <span className="field-tag text-brand flex items-center gap-1.5 mb-4">
              <Sparkles className="w-3 h-3" /> Featured discussion
            </span>
            <div className="border-b border-border pb-10">
              <div className="flex items-center gap-3 mb-5">
                <Avatar className="h-9 w-9 rounded-full border border-border">
                  <AvatarImage src={featuredPost.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${featuredPost.authorId}`} />
                  <AvatarFallback className="rounded-full">{featuredPost.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{featuredPost.authorName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(featuredPost.timestamp))} ago · {featuredPost.category}</p>
                </div>
              </div>
              <h2 className="narrative text-3xl md:text-4xl text-balance mb-3 group-hover:text-brand transition-colors">{featuredPost.title}</h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-2xl line-clamp-2">{featuredPost.content}</p>
              <div className="flex items-center gap-5 mt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {featuredPost.likes}</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {featuredPost.commentCount || 0} replies</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== Search + category chips ===== */}
        <div className="flex flex-col md:flex-row md:items-center gap-5 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search discussions..."
              className="pl-8 pr-0 h-11 border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-brand bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <motion.button
                  key={cat}
                  layout
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isActive ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                  }`}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ===== Feed — journal entries separated by whitespace, not boxed cards ===== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {filteredPosts.length === 0 ? (
              <div className="text-center py-24 border-t border-border">
                <MessageSquare className="w-6 h-6 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="narrative text-2xl mb-2">Nothing here yet.</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">Be the first to start this conversation — someone else is likely wondering the same thing.</p>
              </div>
            ) : (
              <div className="border-t border-border">
                {filteredPosts.map((post, i) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelectedPost(post)}
                    className="py-9 border-b border-border cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-9 w-9 rounded-full border border-border">
                        <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} />
                        <AvatarFallback className="rounded-full">{post.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">{post.authorName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(post.timestamp))} ago</p>
                      </div>
                      <span className="field-tag text-muted-foreground ml-auto shrink-0">{post.category}</span>
                    </div>

                    <h3 className="text-2xl font-semibold tracking-tight mb-2 group-hover:text-brand transition-colors max-w-2xl">{post.title}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl line-clamp-2 mb-5">{post.content}</p>

                    <div className="flex items-center gap-6">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleLike(e, post.id)}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${post.likedBy?.includes(user?.uid || '') ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <motion.span animate={likedPulse === post.id ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>
                          <Heart className={`w-4 h-4 ${post.likedBy?.includes(user?.uid || '') ? 'fill-current' : ''}`} />
                        </motion.span>
                        {post.likes}
                      </motion.button>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" /> {post.commentCount || 0}
                      </span>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ===== Post detail + comments ===== */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="sm:max-w-[680px] rounded-md p-0 border border-border overflow-hidden flex flex-col max-h-[85vh]">
          {selectedPost && (
            <>
              <div className="p-8 pb-6 border-b border-border overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="h-10 w-10 rounded-full border border-border">
                    <AvatarImage src={selectedPost.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.authorId}`} />
                    <AvatarFallback className="rounded-full">{selectedPost.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{selectedPost.authorName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(selectedPost.timestamp))} ago</p>
                  </div>
                  <span className="field-tag text-muted-foreground ml-auto shrink-0">{selectedPost.category}</span>
                </div>
                <h3 className="narrative text-3xl mb-4 text-balance">{selectedPost.title}</h3>
                <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
                <div className="flex items-center gap-6 pt-6 mt-6 border-t border-border">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleLike(e, selectedPost.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${(posts.find(p => p.id === selectedPost.id)?.likedBy ?? selectedPost.likedBy)?.includes(user?.uid || '') ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Heart className={`w-4 h-4 ${(posts.find(p => p.id === selectedPost.id)?.likedBy ?? selectedPost.likedBy)?.includes(user?.uid || '') ? 'fill-current' : ''}`} /> {posts.find(p => p.id === selectedPost.id)?.likes ?? selectedPost.likes}
                  </motion.button>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4" /> {posts.find(p => p.id === selectedPost.id)?.commentCount ?? selectedPost.commentCount ?? 0}
                  </span>
                </div>
              </div>

              {/* Comments — conversational, minimal avatars, no boxed replies */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-card min-h-[200px]">
                <span className="field-tag text-muted-foreground block">{currentComments.length} {currentComments.length === 1 ? 'response' : 'responses'}</span>
                {currentComments.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-6">No responses yet. Be the first to reply.</p>
                ) : (
                  currentComments.map((comment, i) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.4 }}
                      className="flex gap-3.5"
                    >
                      <Avatar className="h-8 w-8 rounded-full border border-border shrink-0 mt-0.5">
                        <AvatarImage src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`} />
                        <AvatarFallback className="rounded-full text-xs">{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h5 className="font-medium text-sm">{comment.authorName}</h5>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp))} ago</span>
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed mt-1 whitespace-pre-wrap">{comment.content}</p>
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1.5 text-xs mt-2 transition-colors ${comment.likedBy?.includes(user?.uid || '') ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-3 h-3 ${comment.likedBy?.includes(user?.uid || '') ? 'fill-current' : ''}`} /> {comment.likes || 0}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-4 bg-card border-t border-border">
                <div className="relative flex items-center">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Write a response..."
                    className="pr-12 h-11 w-full"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    variant="brand"
                    className="absolute right-1.5 h-8 w-8"
                  >
                    {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
