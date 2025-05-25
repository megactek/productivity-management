"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Note, NoteImage } from "@/types";
import { notesService } from "@/services/notes";
import { useErrorHandler } from "./useErrorHandler";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { error, setError, clearError, hasError } = useErrorHandler();

  // Sort notes by creation date (newest first)
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes]);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const fetchedNotes = await notesService.getNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      setError("Failed to fetch notes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clearError, setError]);

  // Refresh notes
  const refreshNotes = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refreshCounter]);

  // Create a new note
  const createNote = useCallback(
    async (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "lastEditedAt" | "version">) => {
      try {
        clearError();
        const newNote = await notesService.createNote(note);
        setNotes((prev) => [...prev, newNote]);
        return newNote;
      } catch (err) {
        setError("Failed to create note");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update a note
  const updateNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => {
      try {
        clearError();
        const updatedNote = await notesService.updateNote(id, updates);
        setNotes((prev) => prev.map((note) => (note.id === id ? updatedNote : note)));
        return updatedNote;
      } catch (err) {
        setError("Failed to update note");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Delete a note
  const deleteNote = useCallback(
    async (id: string) => {
      try {
        clearError();
        await notesService.deleteNote(id);
        setNotes((prev) => prev.filter((note) => note.id !== id));
      } catch (err) {
        setError("Failed to delete note");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Get notes by project
  const getNotesByProject = useCallback(
    async (projectId: string) => {
      try {
        clearError();
        return await notesService.getNotesByProject(projectId);
      } catch (err) {
        setError("Failed to get notes by project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Get notes by todo
  const getNotesByTodo = useCallback(
    async (todoId: string) => {
      try {
        clearError();
        return await notesService.getNotesByTodo(todoId);
      } catch (err) {
        setError("Failed to get notes by todo");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Add image to note
  const addImageToNote = useCallback(
    async (noteId: string, file: File): Promise<NoteImage> => {
      try {
        clearError();
        // For client-side, create a blob URL for the image
        const url = URL.createObjectURL(file);

        const image: Omit<NoteImage, "id" | "createdAt"> = {
          url,
          name: file.name,
          type: file.type,
          size: file.size,
          thumbnail: url, // Simple implementation - in prod would generate thumbnail
        };

        const updatedNote = await notesService.addImageToNote(noteId, image);
        setNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)));

        // Return the last added image
        const addedImage = updatedNote.images![updatedNote.images!.length - 1];
        return addedImage;
      } catch (err) {
        setError("Failed to add image to note");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Remove image from note
  const removeImageFromNote = useCallback(
    async (noteId: string, imageId: string) => {
      try {
        clearError();
        const updatedNote = await notesService.removeImageFromNote(noteId, imageId);
        setNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)));
        return updatedNote;
      } catch (err) {
        setError("Failed to remove image from note");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (noteId: string) => {
      try {
        clearError();
        const updatedNote = await notesService.toggleFavorite(noteId);
        setNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)));
        return updatedNote;
      } catch (err) {
        setError("Failed to toggle favorite status");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  return {
    notes: sortedNotes,
    loading,
    error,
    hasError,
    refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    getNotesByProject,
    getNotesByTodo,
    addImageToNote,
    removeImageFromNote,
    toggleFavorite,
  };
}
