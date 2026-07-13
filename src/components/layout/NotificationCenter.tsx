
import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, FileText, TrendingUp, Zap, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationCenter() {
  const { user } = useAuthStore();
  const { notifications, markNotificationRead, clearNotifications } = useHomeStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'report': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'score': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'recommendation': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'resource': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'community': return <MessageSquare className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted/60 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-background"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border-border/60" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
            onClick={() => user && clearNotifications(user.uid)}
          >
            Clear All
          </Button>
        </div>
        <ScrollArea className="h-[380px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border/40">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer group relative ${!notification.isRead ? 'bg-primary/[0.02]' : ''}`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-background border border-border/40 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-all">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm leading-none ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <time className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.link && (
                        <Button variant="link" className="h-auto p-0 text-[10px] font-bold text-primary" asChild>
                          <Link to={notification.link}>View details</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background border border-border/60">
                        <Check className="h-3 w-3 text-emerald-500" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 px-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <h4 className="text-sm font-medium">No notifications yet</h4>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you here when your safety reports are ready.
              </p>
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border/40 bg-muted/5">
          <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary h-8" asChild>
            <Link to="/settings">Notification Settings</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
