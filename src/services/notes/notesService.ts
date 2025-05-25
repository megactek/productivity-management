import { Note, NoteImage, NoteVersion } from "@/types";
import { storageService } from "../storage";
import { v4 as uuidv4 } from "uuid";

export class NotesService {
  /**
   * Retrieves all notes
   */
  async getNotes(): Promise<Note[]> {
    try {
      return await storageService.read<Note[]>("notes");
    } catch (error) {
      console.error("Failed to get notes:", error);
      throw new Error("Failed to retrieve notes");
    }
  }

  /**
   * Creates a new note
   */
  async createNote(note: Omit<Note, "id" | "createdAt" | "updatedAt" | "lastEditedAt" | "version">): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const timestamp = new Date().toISOString();

      const newNote: Note = {
        ...note,
        id: uuidv4(),
        createdAt: timestamp,
        updatedAt: timestamp,
        lastEditedAt: timestamp,
        version: 1,
        contentType: note.contentType || "markdown",
      };

      await storageService.write("notes", [...notes, newNote]);
      return newNote;
    } catch (error) {
      console.error("Failed to create note:", error);
      throw new Error("Failed to create note");
    }
  }

  /**
   * Updates an existing note
   */
  async updateNote(id: string, note: Partial<Omit<Note, "id" | "createdAt">>): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === id);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${id} not found`);
      }

      const timestamp = new Date().toISOString();
      const currentVersion = notes[noteIndex].version || 1;

      const updatedNote: Note = {
        ...notes[noteIndex],
        ...note,
        updatedAt: timestamp,
        lastEditedAt: timestamp,
        version: currentVersion + 1,
      };

      // Store version history
      await this.createNoteVersion({
        noteId: id,
        content: notes[noteIndex].content,
        timestamp: notes[noteIndex].lastEditedAt || notes[noteIndex].updatedAt,
      });

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to update note:", error);
      throw new Error("Failed to update note");
    }
  }

  /**
   * Deletes a note
   */
  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const filteredNotes = notes.filter((note) => note.id !== id);

      if (notes.length === filteredNotes.length) {
        throw new Error(`Note with id ${id} not found`);
      }

      // Also delete all versions of this note
      await this.deleteAllNoteVersions(id);

      await storageService.write("notes", filteredNotes);
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw new Error("Failed to delete note");
    }
  }

  /**
   * Get notes associated with a project
   */
  async getNotesByProject(projectId: string): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      return notes.filter((note) => note.projectId === projectId);
    } catch (error) {
      console.error("Failed to get notes by project:", error);
      throw new Error("Failed to retrieve notes by project");
    }
  }

  /**
   * Get notes associated with a todo
   */
  async getNotesByTodo(todoId: string): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      return notes.filter(
        (note) => note.todoId === todoId || (note.relatedTodos && note.relatedTodos.includes(todoId))
      );
    } catch (error) {
      console.error("Failed to get notes by todo:", error);
      throw new Error("Failed to retrieve notes by todo");
    }
  }

  /**
   * Add an image to a note
   */
  async addImageToNote(noteId: string, image: Omit<NoteImage, "id" | "createdAt">): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const newImage: NoteImage = {
        ...image,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };

      const updatedNote: Note = {
        ...notes[noteIndex],
        images: [...(notes[noteIndex].images || []), newImage],
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to add image to note:", error);
      throw new Error("Failed to add image to note");
    }
  }

  /**
   * Remove an image from a note
   */
  async removeImageFromNote(noteId: string, imageId: string): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        images: (notes[noteIndex].images || []).filter((img) => img.id !== imageId),
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to remove image from note:", error);
      throw new Error("Failed to remove image from note");
    }
  }

  /**
   * Add a tag to a note
   */
  async addTagToNote(noteId: string, tag: string): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      // Only add the tag if it doesn't already exist
      const currentTags = notes[noteIndex].tags || [];
      if (currentTags.includes(tag)) {
        return notes[noteIndex];
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        tags: [...currentTags, tag],
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to add tag to note:", error);
      throw new Error("Failed to add tag to note");
    }
  }

  /**
   * Remove a tag from a note
   */
  async removeTagFromNote(noteId: string, tag: string): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        tags: (notes[noteIndex].tags || []).filter((t) => t !== tag),
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to remove tag from note:", error);
      throw new Error("Failed to remove tag from note");
    }
  }

  /**
   * Link a note to another note
   */
  async linkNotes(noteId: string, relatedNoteId: string): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      // Check if related note exists
      if (!notes.some((n) => n.id === relatedNoteId)) {
        throw new Error(`Related note with id ${relatedNoteId} not found`);
      }

      // Only add the relation if it doesn't already exist
      const relatedNotes = notes[noteIndex].relatedNotes || [];
      if (relatedNotes.includes(relatedNoteId)) {
        return notes[noteIndex];
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        relatedNotes: [...relatedNotes, relatedNoteId],
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to link notes:", error);
      throw new Error("Failed to link notes");
    }
  }

  /**
   * Unlink a note from another note
   */
  async unlinkNotes(noteId: string, relatedNoteId: string): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        relatedNotes: (notes[noteIndex].relatedNotes || []).filter((id) => id !== relatedNoteId),
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to unlink notes:", error);
      throw new Error("Failed to unlink notes");
    }
  }

  /**
   * Create a version of a note for version history
   */
  private async createNoteVersion(version: Omit<NoteVersion, "id">): Promise<NoteVersion> {
    try {
      const versions = await this.getNoteVersions(version.noteId);

      const newVersion: NoteVersion = {
        ...version,
        id: uuidv4(),
      };

      await storageService.write(`note_versions_${version.noteId}`, [...versions, newVersion]);
      return newVersion;
    } catch (error) {
      console.error("Failed to create note version:", error);
      throw new Error("Failed to create note version");
    }
  }

  /**
   * Get all versions of a note
   */
  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    try {
      return await storageService.read<NoteVersion[]>(`note_versions_${noteId}`).catch(() => []);
    } catch (error) {
      console.error("Failed to get note versions:", error);
      throw new Error("Failed to retrieve note versions");
    }
  }

  /**
   * Delete all versions of a note
   */
  private async deleteAllNoteVersions(noteId: string): Promise<void> {
    try {
      await storageService.write(`note_versions_${noteId}`, []);
    } catch (error) {
      console.error("Failed to delete note versions:", error);
      throw new Error("Failed to delete note versions");
    }
  }

  /**
   * Search notes by content
   */
  async searchNotes(query: string): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      const lowerCaseQuery = query.toLowerCase();

      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerCaseQuery) ||
          note.content.toLowerCase().includes(lowerCaseQuery) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(lowerCaseQuery))
      );
    } catch (error) {
      console.error("Failed to search notes:", error);
      throw new Error("Failed to search notes");
    }
  }

  /**
   * Get notes by tag
   */
  async getNotesByTag(tag: string): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      return notes.filter((note) => note.tags?.includes(tag));
    } catch (error) {
      console.error("Failed to get notes by tag:", error);
      throw new Error("Failed to retrieve notes by tag");
    }
  }

  /**
   * Toggle favorite status of a note
   */
  async toggleFavorite(noteId: string): Promise<Note> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const updatedNote: Note = {
        ...notes[noteIndex],
        isFavorite: !notes[noteIndex].isFavorite,
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      await storageService.write("notes", notes);

      return updatedNote;
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw new Error("Failed to toggle favorite status");
    }
  }
}
