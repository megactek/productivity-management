import { NotesService } from "./notesService";

// Create a singleton instance
export const notesService = new NotesService();

// Re-export for convenience
export * from "./notesService";
