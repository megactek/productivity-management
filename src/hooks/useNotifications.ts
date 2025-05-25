"use client";
import { useState, useEffect, useCallback } from "react";
import { NotificationData, NotificationPreference } from "@/types";
import { notificationService } from "@/services/notification";
import { useErrorHandler } from "./useErrorHandler";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { error, setError, clearError, hasError } = useErrorHandler();

  // Get unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get high priority unread notifications
  const highPriorityUnread = notifications.filter((n) => !n.read && n.priority === "high");

  // Load notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clearError, setError]);

  // Load preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error("Failed to fetch notification preferences:", err);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  // Load notifications on mount and when refreshCounter changes
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences, refreshCounter]);

  // Create notification
  const createNotification = useCallback(
    async (notification: Omit<NotificationData, "id" | "timestamp" | "read">) => {
      try {
        clearError();
        const newNotification = await notificationService.createNotification(notification);
        setNotifications((prev) => [...prev, newNotification]);
        return newNotification;
      } catch (err) {
        setError("Failed to create notification");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Mark as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        clearError();
        const updatedNotification = await notificationService.markAsRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? updatedNotification : n)));
        return updatedNotification;
      } catch (err) {
        setError("Failed to mark notification as read");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      clearError();
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError("Failed to mark all notifications as read");
      console.error(err);
      throw err;
    }
  }, [clearError, setError]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        clearError();
        await notificationService.deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        setError("Failed to delete notification");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update preferences
  const updatePreferences = useCallback(
    async (updatedPreferences: Partial<NotificationPreference>) => {
      try {
        clearError();
        const newPreferences = await notificationService.updatePreferences(updatedPreferences);
        setPreferences(newPreferences);
        return newPreferences;
      } catch (err) {
        setError("Failed to update notification preferences");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Request browser notification permission
  const requestBrowserPermission = useCallback(async () => {
    try {
      clearError();
      return await notificationService.requestBrowserPermission();
    } catch (err) {
      setError("Failed to request browser notification permission");
      console.error(err);
      throw err;
    }
  }, [clearError, setError]);

  // Check if browser notifications are allowed
  const areBrowserNotificationsAllowed = useCallback(() => {
    return notificationService.areBrowserNotificationsAllowed();
  }, []);

  return {
    notifications,
    unreadCount,
    highPriorityUnread,
    preferences,
    loading,
    error,
    hasError,
    refreshNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    requestBrowserPermission,
    areBrowserNotificationsAllowed,
  };
}
