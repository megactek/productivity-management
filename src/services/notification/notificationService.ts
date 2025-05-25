import { NotificationData, NotificationPreference } from "@/types";
import { storageService } from "../storage";
import { v4 as uuidv4 } from "uuid";

export class NotificationService {
  private browserNotificationsSupported: boolean;
  private browserNotificationsPermission: NotificationPermission;

  constructor() {
    this.browserNotificationsSupported = typeof window !== "undefined" && "Notification" in window;
    this.browserNotificationsPermission = this.browserNotificationsSupported ? Notification.permission : "denied";
  }

  /**
   * Get all notifications
   */
  async getNotifications(): Promise<NotificationData[]> {
    try {
      const notifications = await storageService.read<NotificationData[]>("notifications");
      return notifications;
    } catch (error) {
      console.error("Failed to get notifications:", error);
      return [];
    }
  }

  /**
   * Create a notification
   */
  async createNotification(
    notification: Omit<NotificationData, "id" | "timestamp" | "read">
  ): Promise<NotificationData> {
    try {
      const notifications = await this.getNotifications();

      const newNotification: NotificationData = {
        ...notification,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        read: false,
      };

      await storageService.write("notifications", [...notifications, newNotification]);

      // Trigger browser notification if appropriate
      this.triggerBrowserNotification(newNotification);

      return newNotification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<NotificationData> {
    try {
      const notifications = await this.getNotifications();
      const index = notifications.findIndex((n) => n.id === id);

      if (index === -1) {
        throw new Error(`Notification with id ${id} not found`);
      }

      const updatedNotification = {
        ...notifications[index],
        read: true,
      };

      notifications[index] = updatedNotification;
      await storageService.write("notifications", notifications);

      return updatedNotification;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        read: true,
      }));

      await storageService.write("notifications", updatedNotifications);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const filteredNotifications = notifications.filter((n) => n.id !== id);

      if (notifications.length === filteredNotifications.length) {
        throw new Error(`Notification with id ${id} not found`);
      }

      await storageService.write("notifications", filteredNotifications);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw new Error("Failed to delete notification");
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreference> {
    try {
      return await storageService.read<NotificationPreference>("notification_preferences");
    } catch {
      // Return defaults if not found
      const defaults: NotificationPreference = {
        enabled: true,
        channels: ["browser"],
        categories: {
          todo: true,
          project: true,
          note: true,
          system: true,
        },
        priorities: {
          low: true,
          medium: true,
          high: true,
        },
      };

      await storageService.write("notification_preferences", defaults);
      return defaults;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreference>): Promise<NotificationPreference> {
    try {
      const currentPreferences = await this.getPreferences();
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
      };

      await storageService.write("notification_preferences", updatedPreferences);
      return updatedPreferences;
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      throw new Error("Failed to update notification preferences");
    }
  }

  /**
   * Request browser notification permission
   */
  async requestBrowserPermission(): Promise<NotificationPermission> {
    if (!this.browserNotificationsSupported) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      this.browserNotificationsPermission = permission;
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied";
    }
  }

  /**
   * Check if browser notifications are allowed
   */
  areBrowserNotificationsAllowed(): boolean {
    return this.browserNotificationsSupported && this.browserNotificationsPermission === "granted";
  }

  /**
   * Trigger a browser notification
   */
  private triggerBrowserNotification(notification: NotificationData): void {
    if (!this.areBrowserNotificationsAllowed()) {
      return;
    }

    try {
      const preferences = this.getPreferencesSync();

      // Check if notifications are enabled
      if (!preferences.enabled) {
        return;
      }

      // Check if this notification category is enabled
      if (notification.category && !preferences.categories[notification.category]) {
        return;
      }

      // Check if this notification priority is enabled
      if (!preferences.priorities[notification.priority]) {
        return;
      }

      // Check if we're in quiet hours
      if (this.isInQuietHours(preferences)) {
        return;
      }

      // Create browser notification
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      });
    } catch (error) {
      console.error("Failed to trigger browser notification:", error);
    }
  }

  /**
   * Get notification preferences synchronously (from localStorage)
   * This is used internally for the browser notification check
   */
  private getPreferencesSync(): NotificationPreference {
    try {
      if (typeof window === "undefined") {
        return this.getDefaultPreferences();
      }

      const data = localStorage.getItem(`taskflow_data_notification_preferences`);
      if (!data) {
        return this.getDefaultPreferences();
      }

      return JSON.parse(data);
    } catch {
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreference {
    return {
      enabled: true,
      channels: ["browser"],
      categories: {
        todo: true,
        project: true,
        note: true,
        system: true,
      },
      priorities: {
        low: true,
        medium: true,
        high: true,
      },
    };
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(preferences: NotificationPreference): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Parse quiet hours
    const startParts = preferences.quietHoursStart.split(":");
    const endParts = preferences.quietHoursEnd.split(":");

    if (startParts.length !== 2 || endParts.length !== 2) {
      return false;
    }

    const startHour = parseInt(startParts[0], 10);
    const startMinute = parseInt(startParts[1], 10);
    const endHour = parseInt(endParts[0], 10);
    const endMinute = parseInt(endParts[1], 10);

    // Convert to minutes for easier comparison
    const nowMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if we're in quiet hours
    if (startMinutes <= endMinutes) {
      // Simple case: start time is before end time
      return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
    } else {
      // Complex case: quiet hours span midnight
      return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
    }
  }
}
