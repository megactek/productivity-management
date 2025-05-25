"use client";
import { useState, useCallback, useEffect } from "react";
import { useTodos } from "./useTodos";
import { useProjects } from "./useProjects";
import { useNotes } from "./useNotes";
import { AppSettings } from "@/types";
import { storageService } from "@/services/storage";
import { useErrorHandler } from "./useErrorHandler";

export function useAppData() {
  const todoState = useTodos();
  const projectState = useProjects();
  const notesState = useNotes();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError] = useState<string | null>(null);
  const { error, setError, clearError } = useErrorHandler();

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await storageService.read<AppSettings>("settings");
      setSettings(data);
      setIsInitialized(true);
    } catch (err) {
      setError("Failed to load application settings");
      console.error(err);
      // Use default settings as fallback
      setSettings({
        theme: "system",
        notifications: true,
        completionGoal: 5,
        workingHours: {
          start: "09:00",
          end: "17:00",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [clearError, setError]);

  // Update settings
  const updateSettings = useCallback(
    async (updatedSettings: Partial<AppSettings>) => {
      try {
        clearError();

        if (!settings) {
          throw new Error("Settings not initialized");
        }

        const newSettings = {
          ...settings,
          ...updatedSettings,
        };

        await storageService.write("settings", newSettings);
        setSettings(newSettings);
        return newSettings;
      } catch (err) {
        setError("Failed to update settings");
        console.error(err);
        throw err;
      }
    },
    [settings, clearError, setError]
  );

  // Update theme
  const updateTheme = useCallback(
    async (theme: "light" | "dark" | "system") => {
      return updateSettings({ theme });
    },
    [updateSettings]
  );

  // Update notifications
  const updateNotifications = useCallback(
    async (enabled: boolean) => {
      return updateSettings({ notifications: enabled });
    },
    [updateSettings]
  );

  // Initialize app
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply theme
  useEffect(() => {
    if (settings?.theme) {
      const root = window.document.documentElement;

      root.classList.remove("light", "dark");

      if (settings.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(settings.theme);
      }
    }
  }, [settings?.theme]);

  return {
    // Todo state
    ...todoState,

    // Project state
    ...projectState,

    // Notes state
    ...notesState,

    // Settings
    settings,
    updateSettings,
    updateTheme,
    updateNotifications,

    // App state
    loading: loading || todoState.loading || projectState.loading || notesState.loading,
    error: error || todoState.error || projectState.error || notesState.error || initializationError,
    isInitialized,

    // Initialize function (useful for testing)
    initialize: loadSettings,
  };
}
