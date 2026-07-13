
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Search, 
  Plus, 
  Filter,
  Users,
  ShieldCheck,
  Zap,
  Accessibility,
  Laptop,
  MoreHorizontal,
  Clock,
  Send,
  X
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

export function CommunityPage() {
  const { posts, likePost, addPost, addComment, comments, subscribePosts, subscribeComments } = useCommunityStore();
  const { profile, user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const unsubscribe = subscribePosts();
    return () => unsubscribe();
  }, [subscribePosts]);

  useEffect(() => {
    if (expandedPostId) {
      const unsubscribe = subscribeComments(expandedPostId);
      return () => unsubscribe();
    }
  }, [expandedPostId, subscribeComments]);

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;
    
    try {
      await addComment({
        postId,
        authorId: user?.uid || 'anonymous',
        authorName: profile?.name || user?.displayName || 'Anonymous User',
        authorAvatar: profile?.avatar || user?.photoURL || undefined,
        content: newComment,
      });
      
      setNewComment('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const categories = [
    { name: 'All', icon: <Users className="h-4 w-4" /> },
    { name: 'Home Safety', icon: <ShieldCheck className="h-4 w-4" /> },
    { name: 'Caregiving', icon: <Users className="h-4 w-4" /> },
    { name: 'Accessibility', icon: <Accessibility className="h-4 w-4" /> },
    { name: 'Technology', icon: <Laptop className="h-4 w-4" /> },
    { name: 'General', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await addPost({
        authorId: user?.uid || 'anonymous',
        authorName: profile?.name || user?.displayName || 'Anonymous User',
        authorAvatar: profile?.avatar || user?.photoURL || undefined,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category as any,
      });

      setNewPost({ title: '', content: '', category: 'General' });
      setIsCreateModalOpen(false);
      toast.success('Discussion started successfully!');
    } catch (error) {
      toast.error('Failed to start discussion');
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await likePost(postId);
      toast.success('You liked this post');
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleShare = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    const url = window.location.href + '/' + post.id;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Caregiver Community</h1>
          <p className="text-muted-foreground mt-1">Share advice, ask questions, and connect with other caregivers.</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-primary hover:bg-primary/90 shadow-md h-11 px-6 rounded-xl">
              <Plus className="mr-2 h-5 w-5" /> Start Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Start a New Discussion</DialogTitle>
              <DialogDescription>
                Share your experiences or ask for advice from the community.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Title</label>
                <Input 
                  placeholder="What's on your mind?" 
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="bg-muted/30 border-border/40 h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                <Select 
                  value={newPost.category} 
                  onValueChange={(val) => setNewPost({ ...newPost, category: val })}
                >
                  <SelectTrigger className="bg-muted/30 border-border/40 h-11">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.name !== 'All').map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Content</label>
                <Textarea 
                  placeholder="Share your story or question in detail..." 
                  className="min-h-[150px] bg-muted/30 border-border/40 resize-none"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePost} className="px-8">Post Discussion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/60 bg-muted/20 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-2">
              {categories.map((cat) => (
                <Button
                  key={cat.name}
                  variant={activeCategory === cat.name ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-11 rounded-lg transition-all ${activeCategory === cat.name ? 'bg-primary/10 text-primary font-bold border border-primary/20' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <span className={activeCategory === cat.name ? 'text-primary' : 'text-muted-foreground/60'}>
                    {cat.icon}
                  </span>
                  {cat.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-purple-500/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] text-muted-foreground text-center py-4 italic">No trending topics yet.</p>
            </CardContent>
          </Card>
        </div>

        {/* Discussion Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
            <Input 
              placeholder="Search discussions, users, or topics..." 
              className="pl-12 h-12 bg-background border-border/60 shadow-sm rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-border/60 hover:border-primary/20 transition-all group shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/40 shadow-sm">
                            <AvatarImage src={post.authorAvatar} />
                            <AvatarFallback className="font-bold bg-primary/10 text-primary">{post.authorName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-bold leading-none">{post.authorName}</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Contributor</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-primary border-primary/20 bg-primary/5 py-1 px-2">
                            {post.category}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors cursor-pointer leading-tight">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        {post.content}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg font-bold"
                          onClick={(e) => handleLike(e, post.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{post.likes}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg font-bold"
                          onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs">{post.commentCount}</span>
                        </Button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-full hover:bg-primary/5 hover:text-primary transition-all"
                          onClick={(e) => handleShare(e, post)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>

                    <AnimatePresence>
                      {expandedPostId === post.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-muted/30 border-t border-border/40"
                        >
                          <div className="p-4 space-y-4">
                            <div className="space-y-3">
                              {comments.filter(c => c.postId === post.id).map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarImage src={comment.authorAvatar} />
                                    <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-background p-3 rounded-xl border border-border/40 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold">{comment.authorName}</span>
                                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                              {comments.filter(c => c.postId === post.id).length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first to reply!</p>
                              )}
                            </div>

                            <div className="flex gap-3 items-start pt-2">
                              <Avatar className="h-8 w-8 shrink-0 border border-border/40">
                                <AvatarImage src={profile?.avatar || user?.photoURL || undefined} />
                                <AvatarFallback>{profile?.name ? profile.name[0] : (user?.displayName ? user.displayName[0] : 'U')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 relative">
                                <Textarea 
                                  placeholder="Write a comment..." 
                                  className="min-h-[80px] bg-background border-border/60 rounded-xl text-xs pr-12 resize-none"
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button 
                                  size="icon" 
                                  className="absolute right-2 bottom-2 h-8 w-8 rounded-full shadow-md"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!newComment.trim()}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-24 bg-muted/10 rounded-[2rem] border border-dashed border-border/60">
              <MessageSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No matching discussions</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                We couldn't find any discussions matching your criteria. Try adjusting your search or filters.
              </p>
              <Button variant="outline" className="mt-8 rounded-xl" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

