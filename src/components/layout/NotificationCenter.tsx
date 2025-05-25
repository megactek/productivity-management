"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks";
import { Button } from "@/components/ui/Button";
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, X } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";
import { NotificationData } from "@/types";

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestBrowserPermission,
    areBrowserNotificationsAllowed,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Request browser notifications permission
  useEffect(() => {
    if (!permissionRequested && !areBrowserNotificationsAllowed()) {
      setPermissionRequested(true);
    }
  }, [permissionRequested, areBrowserNotificationsAllowed]);

  // Handle permission request
  const handleRequestPermission = async () => {
    try {
      await requestBrowserPermission();
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationData["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get style based on notification priority
  const getPriorityStyle = (priority: NotificationData["priority"]) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500";
      case "medium":
        return "border-l-4 border-amber-500";
      case "low":
        return "border-l-4 border-gray-300";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} side="right">
      <SheetTrigger>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {notifications.length === 0
              ? "You don&apos;t have any notifications."
              : `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}.`}
          </SheetDescription>
        </SheetHeader>

        {!areBrowserNotificationsAllowed() && !permissionRequested && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md my-4 flex items-start gap-2">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Enable browser notifications</p>
              <p className="text-xs">Get notified about important updates even when you&apos;re not on this tab.</p>
              <Button variant="outline" size="sm" onClick={handleRequestPermission} className="mt-1">
                Enable Notifications
              </Button>
            </div>
          </div>
        )}

        <div className="py-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification?.id}
                className={`
                  relative p-3 bg-card rounded-lg shadow-sm
                  ${notification?.read ? "opacity-75" : ""}
                  ${getPriorityStyle(notification?.priority)}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getNotificationIcon(notification?.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm line-clamp-1">{notification?.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification?.timestamp
                          ? formatDistanceToNow(new Date(notification?.timestamp), {
                              addSuffix: true,
                            })
                          : null}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">{notification?.message}</p>

                    {notification?.actions && notification?.actions?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {notification?.actions?.map((action) => (
                          <Button key={action?.id} variant="outline" size="sm">
                            {action?.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {!notification?.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMarkAsRead(notification?.id)}
                    >
                      <Check className="h-3 w-3" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDelete(notification?.id)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <SheetFooter>
          <div className="text-xs text-muted-foreground">
            You can customize notification settings in your profile preferences.
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
