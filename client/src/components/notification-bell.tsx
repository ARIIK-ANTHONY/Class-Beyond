import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { requestNotificationPermission, showNotification } from "@/lib/serviceWorker";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const previousCountRef = useRef<number>(0);
  const { user } = useAuth();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Show browser push notification when new notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const currentUnreadCount = unreadCount;
      
      // Only show push notification if count increased (new notification)
      if (previousCountRef.current > 0 && currentUnreadCount > previousCountRef.current) {
        const newNotifications = notifications
          .filter(n => !n.isRead)
          .slice(0, currentUnreadCount - previousCountRef.current);
        
        // Show browser notification for the newest unread notification
        if (newNotifications.length > 0) {
          const newest = newNotifications[0];
          showNotification(getNotificationTitle(newest.type), {
            body: newest.message,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: newest.id,
            requireInteraction: false,
            data: { notificationId: newest.id, type: newest.type },
          });
        }
      }
      
      previousCountRef.current = currentUnreadCount;
    }
  }, [notifications, unreadCount]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on notification message content and user role
    if (notification.message.includes('approved') || notification.message.includes('rejected')) {
      // Lesson approval/rejection notification for teacher
      setOpen(false);
      setLocation('/teacher/lessons');
    } else if (notification.message.includes('submitted') && notification.message.includes('lesson')) {
      // New lesson submitted - admin should go to approval page
      setOpen(false);
      if (user?.role === 'admin') {
        setLocation('/admin/approval');
      } else {
        setLocation('/teacher/lessons');
      }
    } else if (notification.relatedId) {
      // Navigate based on notification type with relatedId
      setOpen(false);
      if (notification.message.includes('mentorship') || notification.message.includes('session')) {
        // Role-aware redirect for mentorship notifications
        if (user?.role === 'student') {
          setLocation('/'); // Student home page shows upcoming sessions
        } else if (user?.role === 'mentor') {
          setLocation('/mentor/sessions');
        }
      } else if (notification.message.includes('lesson') || notification.message.includes('Lesson')) {
        setLocation(`/lesson/${notification.relatedId}`);
      }
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case "mentorship_request":
        return "New Mentorship Request";
      case "mentorship_approved":
        return "Mentorship Approved!";
      case "mentorship_scheduled":
        return "Session Scheduled";
      case "badge_earned":
        return "Badge Earned! 🏆";
      case "lesson_available":
        return "New Lesson Available";
      case "quiz_reminder":
        return "Quiz Reminder";
      default:
        return "ClassBeyond Notification";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mentorship_request":
        return "person_add";
      case "mentorship_approved":
        return "check_circle";
      case "mentorship_scheduled":
        return "event";
      case "badge_earned":
        return "emoji_events";
      case "lesson_available":
        return "menu_book";
      case "quiz_reminder":
        return "quiz";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "mentorship_request":
        return "text-blue-600";
      case "mentorship_approved":
        return "text-green-600";
      case "mentorship_scheduled":
        return "text-purple-600";
      case "badge_earned":
        return "text-yellow-600";
      case "lesson_available":
        return "text-primary";
      case "quiz_reminder":
        return "text-orange-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <span className="material-icons">notifications</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-icons text-muted-foreground text-5xl mb-2">
                    notifications_none
                  </span>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? "bg-muted/30" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`material-icons ${getNotificationColor(
                            notification.type
                          )} mt-1`}
                        >
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
