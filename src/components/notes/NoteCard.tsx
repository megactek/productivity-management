"use client";

import { useState } from "react";
import { Note } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StarIcon, LinkIcon, ImageIcon, TagIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onFavoriteToggle?: (noteId: string) => void;
  compact?: boolean;
}

export function NoteCard({ note, onClick, onEdit, onDelete, onFavoriteToggle, compact = false }: NoteCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Format the content as a preview (strip markdown/HTML and limit to ~100 chars)
  const contentPreview =
    note.content
      .replace(/[#*`_~>]/g, "") // Remove markdown special chars
      .replace(/<[^>]*>?/gm, "") // Remove HTML tags
      .slice(0, compact ? 50 : 100) + (note.content.length > (compact ? 50 : 100) ? "..." : "");

  // Format the date for display
  const updatedDate = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true });

  // Count images and links
  const imageCount = note.images?.length || 0;
  const hasRelatedItems =
    (note.relatedNotes && note.relatedNotes.length > 0) || (note.relatedTodos && note.relatedTodos.length > 0);

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 ${isHovering ? "shadow-md" : ""} ${
        note.isFavorite ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : ""
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => onClick(note)}
    >
      <CardHeader className={compact ? "p-4" : "p-6"}>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate" style={{ maxWidth: "85%" }}>
            {note.title}
          </CardTitle>
          {note.isFavorite && (
            <StarIcon
              className="h-5 w-5 text-amber-500"
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.(note.id);
              }}
            />
          )}
          {!note.isFavorite && isHovering && (
            <StarIcon
              className="h-5 w-5 text-gray-300 hover:text-amber-500"
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.(note.id);
              }}
            />
          )}
        </div>
        <CardDescription>{updatedDate}</CardDescription>
      </CardHeader>

      <CardContent className={compact ? "p-4 pt-0" : "p-6 pt-0"}>
        <p className="text-sm text-gray-700 dark:text-gray-300">{contentPreview}</p>
      </CardContent>

      <CardFooter className={`flex justify-between items-center ${compact ? "p-4 pt-0" : "p-6 pt-0"}`}>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {imageCount > 0 && (
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-1" />
              <span>{imageCount}</span>
            </div>
          )}

          {hasRelatedItems && (
            <div className="flex items-center">
              <LinkIcon className="h-4 w-4 mr-1" />
            </div>
          )}

          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <TagIcon className="h-4 w-4" />
              {!compact &&
                note.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              {!compact && note.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{note.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {isHovering && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
            >
              Edit
            </Button>
          )}

          {isHovering && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
