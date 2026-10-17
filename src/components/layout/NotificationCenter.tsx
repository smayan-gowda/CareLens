import { useHomeStore } from "@/stores/useHomeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Clock, FileText, TrendingUp, Zap, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationCenter() {
  const { user } = useAuthStore();
  const { notifications, markNotificationRead, clearNotifications } = useHomeStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'report': return <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />;
      case 'score': return <TrendingUp className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />;
      case 'recommendation': return <Zap className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} />;
      case 'resource': return <Clock className="h-3.5 w-3.5 text-warning" strokeWidth={1.75} />;
      case 'community': return <MessageSquare className="h-3.5 w-3.5 text-foreground" strokeWidth={1.75} />;
      default: return <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand" />
          )}
          <span className="sr-only">Notifications</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-md border-border shadow-[var(--elevation-lifted)]" align="end">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && <span className="field-tag text-brand">{unreadCount} new</span>}
          </div>
          <button
            className="field-tag text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => user && clearNotifications(user.uid)}
          >
            Clear all
          </button>
        </div>
        <ScrollArea className="h-[380px]">
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer group relative border-b border-border last:border-b-0 ${!notification.isRead ? 'bg-brand/[0.03]' : ''}`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 h-7 w-7 rounded-sm border border-border flex items-center justify-center shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm leading-none truncate ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>{notification.title}</p>
                        <time className="tabular text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</time>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notification.message}</p>
                      {notification.link && (
                        <Link to={notification.link} className="field-tag text-brand hover:underline inline-block">View details</Link>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="h-6 w-6 rounded-sm border border-border flex items-center justify-center">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 px-8 text-center">
              <Bell className="h-5 w-5 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
              <h4 className="text-sm font-medium">No notifications yet</h4>
              <p className="text-xs text-muted-foreground mt-1">We'll notify you here when your safety reports are ready.</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <Link to="/settings" className="field-tag text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center h-9">
            Notification Settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
