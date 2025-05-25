import { StorageService } from "./storageService";

// Create a singleton instance of the storage service
export const storageService = new StorageService();

// Re-export the service
export * from "./storageService";
