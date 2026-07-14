import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Search, 
  Users, 
  ShieldCheck, 
  Zap, 
  Heart,
  Plus
} from "lucide-react";
import { useCommunityStore } from '@/stores/useCommunityStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';

export function CommunityPage() {
  const { posts } = useCommunityStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'experts' | 'groups'>('feed');

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const expertNetwork = [
    { name: 'Dr. Sarah Jenkins', role: 'Gerontologist', avatar: 'SJ', active: true },
    { name: 'Marcus Cole', role: 'Accessibility Architect', avatar: 'MC', active: false },
    { name: 'Elena Rodriguez', role: 'Senior Care Specialist', avatar: 'ER', active: true },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">Caregiver Network</h1>
          <p className="text-neutral-500 text-lg font-light max-w-xl">Connect with professionals and families managing environmental safety.</p>
        </div>
        <Button className="rounded-full bg-black text-white px-8 h-12 shadow-lg transition-transform hover:scale-105 shrink-0">
           <Plus className="w-5 h-5 mr-2" /> New Discussion
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-8">
           <div className="space-y-2">
             {[
               { id: 'feed', label: 'Global Feed', icon: Users },
               { id: 'experts', label: 'Ask an Expert', icon: ShieldCheck },
               { id: 'groups', label: 'My Support Groups', icon: Heart }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all ${activeTab === tab.id ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'bg-transparent text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}
               >
                 <tab.icon className="w-5 h-5" />
                 {tab.label}
               </button>
             ))}
           </div>

           <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-4">
                 <Zap className="w-5 h-5 text-amber-500" />
                 <h3 className="font-medium">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                 {['#BathroomSafety', '#DementiaCare', '#LightingUpgrades', '#SmartHome'].map(tag => (
                   <div key={tag} className="text-sm text-neutral-600 dark:text-neutral-400 font-medium hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                     {tag}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
           <div className="relative w-full mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <Input 
              placeholder="Search discussions, topics, or people..." 
              className="pl-12 h-14 rounded-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white shadow-sm text-base" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div 
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                    <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No discussions found</h3>
                    <p className="text-neutral-500">Be the first to start a conversation in this topic.</p>
                  </div>
                ) : (
                  filteredPosts.map((post, i) => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} />
                              <AvatarFallback>{post.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                               <h4 className="font-medium text-neutral-900 dark:text-white leading-none">{post.authorName}</h4>
                               <span className="text-xs text-neutral-500 mt-1 block">{formatDistanceToNow(new Date(post.timestamp))} ago</span>
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                            {post.category}
                          </div>
                       </div>
                       
                       <h3 className="text-xl font-medium tracking-tight mb-2 mt-4">{post.title}</h3>
                       <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed mb-6 line-clamp-3">
                         {post.content}
                       </p>

                       <div className="flex items-center gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-2 text-neutral-500 font-medium text-sm hover:text-black dark:hover:text-white transition-colors">
                             <Heart className="w-4 h-4" /> {post.likes}
                          </div>
                          <div className="flex items-center gap-2 text-neutral-500 font-medium text-sm hover:text-black dark:hover:text-white transition-colors">
                             <MessageSquare className="w-4 h-4" /> {post.commentCount || 0}
                          </div>
                       </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'experts' && (
              <motion.div 
                key="experts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid sm:grid-cols-2 gap-6"
              >
                 {expertNetwork.map((expert, i) => (
                   <div key={i} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-neutral-100 text-neutral-600 font-medium">{expert.avatar}</AvatarFallback>
                        </Avatar>
                        {expert.active && <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{expert.name}</h4>
                        <p className="text-sm text-neutral-500">{expert.role}</p>
                        <Button variant="link" className="p-0 h-auto text-black dark:text-white mt-1">Message</Button>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
