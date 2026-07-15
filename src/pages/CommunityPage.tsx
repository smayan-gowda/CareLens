import { useState, useEffect } from 'react';
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
  DialogTrigger,
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
  Users, 
  Heart,
  Plus,
  Loader2,
  Send
} from "lucide-react";
import { useCommunityStore } from '@/stores/useCommunityStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { CommunityPost } from '@/types/home';

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

  const filteredPosts = posts.filter(post => 
    (activeCategory === 'All' || post.category === activeCategory) &&
    (post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
      toast.success('Discussion created successfully');
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
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const currentComments = comments.filter(c => c.postId === selectedPost?.id);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-5xl mx-auto mb-12">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">Caregiver Network</h1>
          <p className="text-neutral-500 text-lg font-light max-w-xl">Connect with professionals and families managing environmental safety.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-foreground text-background px-8 h-12 shadow-md transition-all active:scale-95 shrink-0 text-base font-medium">
               <Plus className="w-5 h-5 mr-2" /> New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8 border border-black/5 dark:border-white/5 shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-medium tracking-tight">Start a Discussion</DialogTitle>
              <DialogDescription className="text-base font-light mt-2">
                Share your experience or ask a question to the community.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                <Select 
                  value={newPost.category} 
                  onValueChange={(val: any) => setNewPost({...newPost, category: val})}
                >
                  <SelectTrigger className="w-full h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl shadow-none text-base pl-4">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border shadow-xl">
                    {categories.filter(c => c !== 'All').map(cat => (
                      <SelectItem key={cat} value={cat} className="py-3 rounded-xl">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                <Input 
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="e.g. Recommendations for bathroom grab bars?" 
                  className="h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl shadow-none text-base px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Message</Label>
                <Textarea 
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Describe your situation or question..." 
                  className="min-h-[150px] resize-none bg-muted/50 border-transparent focus:border-border rounded-2xl shadow-none text-base p-4"
                />
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="h-12 rounded-2xl px-6 font-medium border-border"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDiscussion}
                disabled={isSubmitting}
                className="h-12 rounded-2xl px-8 font-medium bg-foreground text-background"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Discussion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-4 gap-12 max-w-5xl mx-auto">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-8">
           <div className="space-y-2">
             <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4 ml-2">Categories</h3>
             {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-medium transition-all ${activeCategory === cat ? 'bg-card border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-foreground' : 'bg-transparent text-muted-foreground hover:bg-muted/50 font-light'}`}
               >
                 <span>{cat}</span>
                 {activeCategory === cat && <div className="w-2 h-2 rounded-full bg-foreground" />}
               </button>
             ))}
           </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-8">
           <div className="relative w-full mb-4">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
            <Input 
              placeholder="Search discussions, topics, or people..." 
              className="pl-14 h-16 rounded-full bg-card border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] focus-visible:ring-border text-base" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <AnimatePresence mode="wait">
              <motion.div 
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-24 bg-card rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2 tracking-tight">No discussions found</h3>
                    <p className="text-muted-foreground font-light">Be the first to start a conversation in this topic.</p>
                  </div>
                ) : (
                  filteredPosts.map((post, i) => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setSelectedPost(post)}
                      className="bg-card rounded-[2.5rem] p-10 border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-xl transition-shadow cursor-pointer"
                    >
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-5">
                            <Avatar className="h-14 w-14 shadow-sm border border-black/5 dark:border-white/5">
                              <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} />
                              <AvatarFallback>{post.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                               <h4 className="font-medium text-foreground text-base tracking-tight leading-none">{post.authorName}</h4>
                               <span className="text-sm text-muted-foreground font-light mt-1.5 block">{formatDistanceToNow(new Date(post.timestamp))} ago</span>
                            </div>
                          </div>
                          <div className="px-4 py-1.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-widest border border-border/50">
                            {post.category}
                          </div>
                       </div>
                       
                       <h3 className="text-2xl font-medium tracking-tight mb-3">{post.title}</h3>
                       <p className="text-muted-foreground text-base font-light leading-relaxed mb-8 line-clamp-3">
                         {post.content}
                       </p>

                       <div className="flex items-center gap-8 pt-6 border-t border-black/5 dark:border-white/5">
                          <button 
                            onClick={(e) => handleLike(e, post.id)} 
                            className={`flex items-center gap-3 font-medium text-sm transition-colors ${post.likedBy?.includes(user?.uid || '') ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                             <Heart className={`w-5 h-5 ${post.likedBy?.includes(user?.uid || '') ? 'fill-current' : ''}`} /> {post.likes}
                          </button>
                          <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm hover:text-foreground transition-colors">
                             <MessageSquare className="w-5 h-5" /> {post.commentCount || 0}
                          </div>
                       </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-0 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {selectedPost && (
            <>
              <div className="p-8 pb-6 border-b border-black/5 dark:border-white/5 bg-muted/10 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    <Avatar className="h-12 w-12 shadow-sm border border-black/5 dark:border-white/5">
                      <AvatarImage src={selectedPost.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.authorId}`} />
                      <AvatarFallback>{selectedPost.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-medium text-foreground text-base tracking-tight leading-none">{selectedPost.authorName}</h4>
                        <span className="text-sm text-muted-foreground font-light mt-1.5 block">{formatDistanceToNow(new Date(selectedPost.timestamp))} ago</span>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-widest border border-border/50">
                    {selectedPost.category}
                  </div>
                </div>
                <h3 className="text-2xl font-medium tracking-tight mb-4">{selectedPost.title}</h3>
                <p className="text-foreground text-base font-light leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
                <div className="flex items-center gap-8 pt-6 mt-6 border-t border-black/5 dark:border-white/5">
                  <button 
                    onClick={(e) => handleLike(e, selectedPost.id)} 
                    className={`flex items-center gap-3 font-medium text-sm transition-colors ${(posts.find(p => p.id === selectedPost.id)?.likedBy ?? selectedPost.likedBy)?.includes(user?.uid || '') ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                      <Heart className={`w-5 h-5 ${(posts.find(p => p.id === selectedPost.id)?.likedBy ?? selectedPost.likedBy)?.includes(user?.uid || '') ? 'fill-current' : ''}`} /> {posts.find(p => p.id === selectedPost.id)?.likes ?? selectedPost.likes}
                  </button>
                  <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm">
                      <MessageSquare className="w-5 h-5" /> {posts.find(p => p.id === selectedPost.id)?.commentCount ?? selectedPost.commentCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-card min-h-[200px]">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4">Responses ({currentComments.length})</h4>
                {currentComments.length === 0 ? (
                  <p className="text-muted-foreground font-light text-sm text-center py-8">No responses yet. Be the first to reply!</p>
                ) : (
                  currentComments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="h-10 w-10 shadow-sm border border-black/5 dark:border-white/5 shrink-0">
                        <AvatarImage src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`} />
                        <AvatarFallback>{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/30 rounded-2xl p-4 flex-1">
                        <div className="flex items-baseline justify-between mb-2">
                          <h5 className="font-medium text-sm">{comment.authorName}</h5>
                          <span className="text-xs text-muted-foreground font-light">{formatDistanceToNow(new Date(comment.timestamp))}</span>
                        </div>
                        <p className="text-sm font-light text-foreground whitespace-pre-wrap mb-3">{comment.content}</p>
                        <div className="flex items-center gap-4 pt-3 border-t border-black/5 dark:border-white/5">
                          <button 
                            onClick={() => handleLikeComment(comment.id)} 
                            className={`flex items-center gap-2 font-medium text-xs transition-colors ${comment.likedBy?.includes(user?.uid || '') ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                             <Heart className={`w-4 h-4 ${comment.likedBy?.includes(user?.uid || '') ? 'fill-current' : ''}`} /> {comment.likes || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-card border-t border-black/5 dark:border-white/5">
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
                    className="pl-4 pr-12 h-14 bg-muted/50 border-transparent focus:border-border rounded-2xl shadow-none text-base w-full"
                  />
                  <Button 
                    size="icon"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="absolute right-2 h-10 w-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all"
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
