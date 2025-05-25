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

        // Process the image to reduce file size while maintaining quality
        const processedImage = await processImage(file);

        // Convert the blob to a data URL for persistent storage
        const dataUrl = await blobToDataURL(processedImage.blob);

        // Log for debugging
        console.log(`Processing image for note ${noteId}:`, {
          name: file.name,
          originalSize: file.size,
          processedSize: processedImage.size,
          dimensions: `${processedImage.width}x${processedImage.height}`,
        });

        const image: Omit<NoteImage, "id" | "createdAt"> = {
          url: dataUrl,
          name: file.name,
          type: processedImage.type,
          size: processedImage.size,
          thumbnail: await createThumbnail(processedImage.blob),
          originalSize: file.size, // Store original size for reference
          width: processedImage.width,
          height: processedImage.height,
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

  // Helper function to convert a blob to a data URL
  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to convert blob to data URL"));
      reader.readAsDataURL(blob);
    });
  };

  // Process image to reduce file size while maintaining quality
  const processImage = async (
    file: File
  ): Promise<{
    blob: Blob;
    type: string;
    size: number;
    width: number;
    height: number;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Get original dimensions
          const originalWidth = img.width;
          const originalHeight = img.height;

          // Set max dimensions (maintain aspect ratio)
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          let width = originalWidth;
          let height = originalHeight;

          // Resize if larger than max dimensions
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width / height > MAX_WIDTH / MAX_HEIGHT) {
              // Width is the limiting factor
              width = MAX_WIDTH;
              height = Math.round(originalHeight * (MAX_WIDTH / originalWidth));
            } else {
              // Height is the limiting factor
              height = MAX_HEIGHT;
              width = Math.round(originalWidth * (MAX_HEIGHT / originalHeight));
            }
          }

          // Create canvas for resizing
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality setting
          const QUALITY = 0.85; // 85% quality - good balance between quality and size
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create image blob"));
                return;
              }
              resolve({
                blob,
                type: blob.type,
                size: blob.size,
                width,
                height,
              });
            },
            file.type,
            QUALITY
          );
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  };

  // Create thumbnail for image preview
  const createThumbnail = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Set thumbnail dimensions
          const THUMB_WIDTH = 200;
          const THUMB_HEIGHT = 200;

          // Calculate thumbnail dimensions (maintain aspect ratio)
          const aspectRatio = img.width / img.height;
          let width = THUMB_WIDTH;
          let height = THUMB_HEIGHT;

          if (aspectRatio > 1) {
            // Landscape
            height = THUMB_WIDTH / aspectRatio;
          } else {
            // Portrait
            width = THUMB_HEIGHT * aspectRatio;
          }

          // Create canvas for thumbnail
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };

        img.onerror = () => {
          reject(new Error("Failed to load image for thumbnail"));
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file for thumbnail"));
      };

      reader.readAsDataURL(blob);
    });
  };

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
