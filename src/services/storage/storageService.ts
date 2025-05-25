"use client";

import { toast } from "@/components/ui/Toast";

type EntityType = "todos" | "projects" | "notes" | "settings" | "metadata" | string;

interface StorageConfig {
  useServerStorage: boolean;
  apiBasePath: string;
  fallbackToLocalStorage: boolean;
}

/**
 * Service for handling JSON storage operations (browser and server compatible)
 */
export class StorageService {
  private basePath: string;
  private isClient: boolean;
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.isClient = typeof window !== "undefined";
    this.basePath = this.isClient ? "taskflow_data" : "";
    this.config = {
      useServerStorage: true, // Default to server storage
      apiBasePath: "/api/storage",
      fallbackToLocalStorage: true,
      ...config,
    };
  }

  /**
   * Get the storage key for an entity
   */
  private getStorageKey(entity: EntityType, filename?: string): string {
    if (entity === "metadata") {
      return `${this.basePath}_metadata`;
    }

    const entityKey = `${this.basePath}_${entity}`;
    return filename ? `${entityKey}_${filename}` : entityKey;
  }

  /**
   * Read data from storage (server or local)
   */
  async read<T>(entity: EntityType, filename?: string): Promise<T> {
    try {
      if (!this.isClient) {
        console.warn("StorageService: read() called on server side. Returning empty data.");
        return this.getEmptyDataByEntityType(entity) as T;
      }

      // Try server storage first if enabled
      if (this.config.useServerStorage) {
        try {
          const response = await fetch(`${this.config.apiBasePath}/${entity}${filename ? `/${filename}` : ""}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`Read data for ${entity} from server, found data`);
            return data as T;
          } else if (response.status === 404) {
            console.log(`No data found for ${entity} on server, initializing with empty data`);
            return this.getEmptyDataByEntityType(entity) as T;
          } else {
            throw new Error(`Server returned status ${response.status}`);
          }
        } catch (error) {
          console.warn(`Failed to read ${entity} from server:`, error);

          // Fall back to localStorage if enabled
          if (!this.config.fallbackToLocalStorage) {
            throw error;
          }

          console.log(`Falling back to localStorage for ${entity}`);
        }
      }

      // Use localStorage as fallback or if server storage is disabled
      const storageKey = this.getStorageKey(entity, filename);
      const rawData = localStorage.getItem(storageKey);

      if (!rawData) {
        console.log(`No data found for ${entity} in localStorage, initializing with empty data`);
        return this.getEmptyDataByEntityType(entity) as T;
      }

      console.log(`Read data for ${entity} from localStorage, found ${rawData.length} characters`);
      return JSON.parse(rawData) as T;
    } catch (error) {
      console.error(`Error reading ${entity} data:`, error);
      // Return empty data on error instead of throwing
      return this.getEmptyDataByEntityType(entity) as T;
    }
  }

  /**
   * Write data to storage (server or local)
   */
  async write<T>(entity: EntityType, data: T, filename?: string): Promise<void> {
    try {
      if (!this.isClient) {
        console.warn("StorageService: write() called on server side. Operation skipped.");
        return;
      }

      const jsonData = JSON.stringify(data);
      let serverWriteSuccessful = false;

      // Try server storage first if enabled
      if (this.config.useServerStorage) {
        try {
          const response = await fetch(`${this.config.apiBasePath}/${entity}${filename ? `/${filename}` : ""}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: jsonData,
          });

          if (response.ok) {
            console.log(`Successfully wrote data for ${entity} to server`);
            serverWriteSuccessful = true;
          } else {
            throw new Error(`Server returned status ${response.status}`);
          }
        } catch (error) {
          console.warn(`Failed to write ${entity} to server:`, error);

          // Show toast notification about server storage failure
          toast.toast({
            title: "Storage Warning",
            description: "Could not save to server. Data saved locally only.",
            variant: "warning",
          });

          // Don't throw if we can fall back to localStorage
          if (!this.config.fallbackToLocalStorage) {
            throw error;
          }

          console.log(`Falling back to localStorage for ${entity}`);
        }
      }

      // Use localStorage as fallback or if server storage is disabled
      if (!serverWriteSuccessful && (this.config.fallbackToLocalStorage || !this.config.useServerStorage)) {
        const storageKey = this.getStorageKey(entity, filename);
        console.log(`Writing data to localStorage:${storageKey}, data size: ${jsonData.length} characters`);

        // Create a backup before writing
        const existingData = localStorage.getItem(storageKey);
        if (existingData) {
          localStorage.setItem(`${storageKey}_backup`, existingData);
          console.log(`Created backup of existing ${entity} data in localStorage`);
        }

        // Write the data
        localStorage.setItem(storageKey, jsonData);

        // Verify the data was written
        const verificationData = localStorage.getItem(storageKey);
        if (!verificationData) {
          console.error(`Failed to verify data was written to localStorage:${storageKey}`);
        } else if (verificationData.length !== jsonData.length) {
          console.error(
            `Data verification failed: expected ${jsonData.length} characters but got ${verificationData.length}`
          );
        } else {
          console.log(`Successfully wrote and verified data for ${entity} in localStorage`);
        }
      }

      // Update metadata
      if (entity !== "metadata") {
        this.updateMetadata();
      }
    } catch (error) {
      console.error(`Error writing ${entity} data:`, error);
      throw new Error(`Failed to save ${entity} data`);
    }
  }

  /**
   * Update metadata with last sync time
   */
  private async updateMetadata(): Promise<void> {
    try {
      let metadata: Record<string, unknown>;
      try {
        metadata = await this.read<Record<string, unknown>>("metadata");
      } catch {
        metadata = { lastSync: null };
      }

      metadata.lastSync = new Date().toISOString();
      await this.write("metadata", metadata);
    } catch (error) {
      console.error("Error updating metadata:", error);
    }
  }

  /**
   * Check if data exists
   */
  async exists(entity: EntityType, filename?: string): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    // Try server storage first if enabled
    if (this.config.useServerStorage) {
      try {
        const response = await fetch(`${this.config.apiBasePath}/${entity}${filename ? `/${filename}` : ""}/exists`);
        if (response.ok) {
          const data = await response.json();
          return data.exists;
        }
      } catch (error) {
        console.warn(`Failed to check if ${entity} exists on server:`, error);

        // Fall back to localStorage if enabled
        if (!this.config.fallbackToLocalStorage) {
          return false;
        }
      }
    }

    // Use localStorage as fallback or if server storage is disabled
    const storageKey = this.getStorageKey(entity, filename);
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Create a backup of the data
   */
  async createBackup(entity: EntityType, filename?: string): Promise<string> {
    if (!this.isClient) {
      throw new Error("StorageService: createBackup() called on server side.");
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");

    // Try server storage first if enabled
    if (this.config.useServerStorage) {
      try {
        const response = await fetch(`${this.config.apiBasePath}/${entity}${filename ? `/${filename}` : ""}/backup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timestamp }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Successfully created backup for ${entity} on server`);
          return data.backupId;
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      } catch (error) {
        console.warn(`Failed to create backup for ${entity} on server:`, error);

        // Fall back to localStorage if enabled
        if (!this.config.fallbackToLocalStorage) {
          throw error;
        }
      }
    }

    // Use localStorage as fallback or if server storage is disabled
    const storageKey = this.getStorageKey(entity, filename);
    const backupKey = `${storageKey}_${timestamp}_backup`;

    const data = localStorage.getItem(storageKey);
    if (!data) {
      throw new Error(`${entity} data does not exist in localStorage`);
    }

    localStorage.setItem(backupKey, data);
    return backupKey;
  }

  /**
   * Restore from a backup
   */
  async restoreFromBackup(entity: EntityType, backupId: string): Promise<void> {
    if (!this.isClient) {
      throw new Error("StorageService: restoreFromBackup() called on server side.");
    }

    // Try server storage first if enabled
    if (this.config.useServerStorage) {
      try {
        const response = await fetch(`${this.config.apiBasePath}/${entity}/restore`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ backupId }),
        });

        if (response.ok) {
          console.log(`Successfully restored ${entity} from backup on server`);
          return;
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      } catch (error) {
        console.warn(`Failed to restore ${entity} from backup on server:`, error);

        // Fall back to localStorage if enabled
        if (!this.config.fallbackToLocalStorage) {
          throw error;
        }
      }
    }

    // Use localStorage as fallback or if server storage is disabled
    const data = localStorage.getItem(backupId);
    if (!data) {
      throw new Error("Backup data does not exist in localStorage");
    }

    const storageKey = this.getStorageKey(entity);
    localStorage.setItem(storageKey, data);
  }

  /**
   * Toggle between server and local storage
   */
  setUseServerStorage(useServer: boolean): void {
    this.config.useServerStorage = useServer;
    console.log(`Storage mode set to: ${useServer ? "server" : "local"} storage`);
  }

  /**
   * Helper to get appropriate empty data by entity type
   */
  private getEmptyDataByEntityType(entity: EntityType): unknown {
    if (entity === "todos" || entity === "projects" || entity === "notes" || entity === "notifications") {
      return [];
    } else if (entity === "settings") {
      return {
        theme: "system",
        notifications: true,
        completionGoal: 5,
        workingHours: {
          start: "09:00",
          end: "17:00",
        },
        useServerStorage: true,
      };
    } else if (entity === "notification_preferences") {
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
    } else {
      return {};
    }
  }
}

export const storageService = new StorageService();
