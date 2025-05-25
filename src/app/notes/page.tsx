"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppDataContext } from "@/context/AppDataContext";
import { Note } from "@/types";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Search, StarIcon } from "lucide-react";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Select } from "@/components/ui/Select";

export default function NotesPage() {
  const { notes, loading, error, createNote, updateNote, deleteNote, addImageToNote, toggleFavorite } =
    useAppDataContext();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const handleAddClick = () => {
    setEditingNote(undefined);
    setIsEditorOpen(true);
  };

  const handleEditClick = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(id);
      } catch (err) {
        console.error("Failed to delete note:", err);
      }
    }
  };

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleEditorSave = async (data: Omit<Note, "id" | "createdAt" | "updatedAt" | "lastEditedAt" | "version">) => {
    try {
      if (editingNote) {
        await updateNote(editingNote.id, data);
      } else {
        await createNote(data);
      }
      setIsEditorOpen(false);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleEditorCancel = () => {
    setIsEditorOpen(false);
    setEditingNote(undefined);
  };

  const handleFavoriteToggle = async (noteId: string) => {
    try {
      await toggleFavorite(noteId);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleImageAdd = async (noteId: string | undefined, file: File) => {
    if (!noteId) throw new Error("Note ID is required");
    return await addImageToNote(noteId, file);
  };

  // Get all unique tags from notes
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags || []).filter(Boolean))).sort();

  // Apply filters and sorting
  let filteredNotes = [...notes];

  // Filter by search
  if (searchQuery) {
    filteredNotes = filteredNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by tag
  if (selectedTag) {
    filteredNotes = filteredNotes.filter((note) => note.tags?.includes(selectedTag));
  }

  // Filter by favorites
  if (showFavoritesOnly) {
    filteredNotes = filteredNotes.filter((note) => note.isFavorite);
  }

  // Apply sorting
  switch (sortBy) {
    case "newest":
      filteredNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case "oldest":
      filteredNotes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      break;
    case "title":
      filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <BackButton fallbackPath="/" label="Back to Dashboard" />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
            <p className="text-muted-foreground">Capture and organize your thoughts.</p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-1" /> New Note
          </Button>
        </div>

        {error && <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.length > 0 && (
              <Select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="w-40">
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </Select>
            )}

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "title")}
              className="w-40"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">By Title</option>
            </Select>

            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="icon"
              className="h-10 w-10"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title="Show favorites only"
            >
              <StarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-background">
            <h3 className="text-lg font-medium">No notes found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedTag || showFavoritesOnly
                ? "Try different search criteria"
                : "Create your first note to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={handleNoteClick}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}

        {isEditorOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-auto">
              <NoteEditor
                note={editingNote}
                onSave={handleEditorSave}
                onCancel={handleEditorCancel}
                onDelete={editingNote ? handleDeleteClick : undefined}
                onAddImage={handleImageAdd}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
