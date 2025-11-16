"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Inbox,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface NotificationDropdownProps {
  partnerId: Id<"partners">;
}

export function NotificationDropdown({ partnerId }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notifications = useQuery(api.notifications.getNotifications, {
    partnerId,
    limit: 20,
  });

  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    partnerId,
  });

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const deleteReadNotifications = useMutation(api.notifications.deleteReadNotifications);

  // Play notification sound when new notification arrives
  useEffect(() => {
    if (unreadCount !== undefined && unreadCount > lastCount && lastCount > 0) {
      playNotificationSound();
    }
    if (unreadCount !== undefined) {
      setLastCount(unreadCount);
    }
  }, [unreadCount, lastCount]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("Failed to play notification sound:", err);
      });
    }
  };

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead({ partnerId });
      if (result.count > 0) {
        toast.success(`Marked ${result.count} notifications as read`);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotification({ notificationId });
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleDeleteRead = async () => {
    try {
      const result = await deleteReadNotifications({ partnerId });
      if (result.count > 0) {
        toast.success(`Deleted ${result.count} read notifications`);
      } else {
        toast.info("No read notifications to delete");
      }
    } catch (error) {
      console.error("Failed to delete read notifications:", error);
      toast.error("Failed to delete read notifications");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "withdrawal":
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      case "campaign":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "withdrawal":
        return "bg-orange-50 border-orange-200 dark:bg-orange-950/20";
      case "campaign":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20";
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-950/20";
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-950/20";
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20";
      default:
        return "bg-muted/50 border-border";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] sm:w-[420px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {unreadCount !== undefined && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            
            {notifications && notifications.some((n) => n.isRead) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDeleteRead}
                title="Clear read notifications"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground text-center">
                You're all caught up! We'll notify you when something important happens.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "group relative p-3 rounded-lg border transition-all",
                    notification.isRead
                      ? "bg-background/50 border-border hover:bg-muted/30"
                      : getNotificationColor(notification.type),
                    "cursor-pointer"
                  )}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkAsRead(notification._id);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {notification.title}
                        </p>
                        
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification._id);
                            }}
                            title="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <div className="border-t p-3">
            <Button
              variant="ghost"
              className="w-full text-xs text-primary"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}