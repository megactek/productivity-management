"use client";

import { useState, useRef, useEffect } from "react";
import { Note, NoteImage } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Code,
  Quote,
  Save,
  X,
  Trash2,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "lastEditedAt" | "version">) => Promise<Note>;
  onCancel: () => void;
  onDelete?: (noteId: string) => void;
  onAddImage?: (noteId: string | undefined, file: File) => Promise<NoteImage>;
  projectId?: string;
  todoId?: string;
}

export function NoteEditor({ note, onSave, onCancel, onDelete, onAddImage, projectId, todoId }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [contentType] = useState<"markdown" | "richtext">(note?.contentType || "markdown");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Store temporary images for new notes
  const [tempImages, setTempImages] = useState<{ file: File; tempUrl: string; altText: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to insert markdown at cursor position
  const insertAtCursor = (before: string, after: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    const newContent = beforeText + before + selectedText + after + afterText;
    setContent(newContent);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // Focus the title input on mount
  useEffect(() => {
    if (!note) {
      const timeout = setTimeout(() => {
        document.getElementById("note-title-input")?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      // Check for broken image URLs in the content
      validateImageUrls(note.content);
    }
  }, [note]);

  // Validate image URLs in content
  const validateImageUrls = (contentToCheck: string) => {
    // Extract all image URLs from the content
    const imageUrlRegex = /!\[.*?\]\((.*?)\)/g;
    const matches = [...contentToCheck.matchAll(imageUrlRegex)];
    const imageUrls = matches.map((match) => match[1]);

    // Check each URL
    imageUrls.forEach((url) => {
      if (!url) return;

      // Check if it's a blob URL (these won't be valid when reloading)
      if (url.startsWith("blob:")) {
        console.warn("Found invalid blob URL in loaded note:", url);
      }

      // For non-blob URLs, we could add additional validation if needed
    });
  };

  // Setup paste handler for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!textareaRef.current || !e.clipboardData || !onAddImage) return;

      // Check if clipboard has files/images
      const items = e.clipboardData.items;
      if (!items) return;

      // Look for image content
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault(); // Prevent default paste behavior

          // Get the image file
          const file = items[i].getAsFile();
          if (!file) continue;

          try {
            setUploadingImage(true);
            setUploadProgress(10);

            // Generate a name for the pasted image
            const timestamp = new Date().getTime();
            const pastedFileName = `pasted-image-${timestamp}.png`;
            const pastedFile = new File([file], pastedFileName, { type: file.type });

            // Generate alt text
            const altText = `Pasted image ${timestamp}`;

            // Simulate progress
            const progressInterval = setInterval(() => {
              setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 100);

            // If we have a note ID, add the image directly
            if (note?.id) {
              const image = await onAddImage(note.id, pastedFile);
              clearInterval(progressInterval);
              setUploadProgress(100);

              // Insert markdown image tag at cursor position
              insertAtCursor(`![${altText}](${image.url})`, "");
            } else {
              // We're creating a new note, store the file for later upload
              const tempUrl = URL.createObjectURL(file);

              // Add to temporary images
              setTempImages((prev) => [...prev, { file: pastedFile, tempUrl, altText }]);

              clearInterval(progressInterval);
              setUploadProgress(100);

              // Insert markdown image tag at cursor position
              insertAtCursor(`![${altText}](${tempUrl})`, "");
            }

            // Reset upload state after a delay
            setTimeout(() => {
              setUploadingImage(false);
              setUploadProgress(0);
            }, 1000);
          } catch (error) {
            console.error("Failed to process pasted image:", error);
            setUploadingImage(false);
            setUploadProgress(0);
          }
        }
      }
    };

    // Add paste event listener to the textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("paste", handlePaste);
    }

    // Cleanup
    return () => {
      if (textarea) {
        textarea.removeEventListener("paste", handlePaste);
      }
    };
  }, [note, onAddImage, setTempImages, insertAtCursor]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all temporary blob URLs to prevent memory leaks
      tempImages.forEach((img) => {
        try {
          URL.revokeObjectURL(img.tempUrl);
        } catch (err) {
          console.error("Failed to revoke blob URL:", err);
        }
      });
    };
  }, [tempImages]);

  // Markdown toolbar handlers
  const handleBold = () => insertAtCursor("**", "**");
  const handleItalic = () => insertAtCursor("*", "*");
  const handleH1 = () => insertAtCursor("\n# ");
  const handleH2 = () => insertAtCursor("\n## ");
  const handleBulletList = () => insertAtCursor("\n- ");
  const handleNumberedList = () => insertAtCursor("\n1. ");
  const handleQuote = () => insertAtCursor("\n> ");
  const handleCode = () => insertAtCursor("\n```\n", "\n```");
  const handleLink = () => insertAtCursor("[", "](url)");

  // Handle tag addition
  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput("");
    setIsTagDialogOpen(false);
  };

  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Handle image upload
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onAddImage) return;

    try {
      setUploadingImage(true);
      setUploadProgress(10); // Start progress indicator

      const file = files[0];

      // Simulate progress (in a real app, this would be based on actual upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Generate alt text for the image
      const altText = file.name.split(".").slice(0, -1).join(".") || file.name;

      // If we have a note ID, add the image directly
      if (note?.id) {
        const image = await onAddImage(note.id, file);
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Insert markdown image tag at cursor position with proper alt text
        insertAtCursor(`![${altText}](${image.url})`, "");
      } else {
        // We're creating a new note, store the file for later upload
        const tempUrl = URL.createObjectURL(file);

        // Add to temporary images
        setTempImages((prev) => [...prev, { file, tempUrl, altText }]);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Insert markdown image tag at cursor position
        insertAtCursor(`![${altText}](${tempUrl})`, "");
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset upload state after a delay
      setTimeout(() => {
        setUploadingImage(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Failed to upload image:", error);
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title for the note.");
      return;
    }

    try {
      // Extract all image URLs from the content using regex
      const imageUrlRegex = /!\[.*?\]\((.*?)\)/g;
      const matches = [...content.matchAll(imageUrlRegex)];
      const imageUrls = matches.map((match) => match[1]);

      // Check if there are any blob URLs in the content
      const blobUrls = imageUrls.filter((url) => url && url.startsWith("blob:"));

      // Log for debugging
      console.log("Found blob URLs:", blobUrls);
      console.log("Temp images:", tempImages);

      // Prepare note data
      const noteData = {
        title,
        content,
        contentType,
        tags,
        projectId: note?.projectId || projectId,
        todoId: note?.todoId || todoId,
        // These fields will be set by the service
        images: note?.images || [],
        folder: note?.folder,
        isFavorite: note?.isFavorite || false,
        relatedNotes: note?.relatedNotes,
        relatedTodos: note?.relatedTodos,
      };

      // If we're editing an existing note and there are blob URLs
      if (note?.id && blobUrls.length > 0 && onAddImage) {
        // Process blob URLs for existing note
        let updatedContent = content;

        // Upload each blob image and update content
        for (const blobUrl of blobUrls) {
          // Find the temporary image that matches this blob URL
          const tempImage = tempImages.find((img) => img.tempUrl === blobUrl);
          if (tempImage) {
            try {
              // Upload the image to the note
              const uploadedImage = await onAddImage(note.id, tempImage.file);

              // Replace the blob URL with the actual URL in the content
              updatedContent = updatedContent.replace(
                new RegExp(`\\!\\[.*?\\]\\(${escapeRegExp(blobUrl)}\\)`, "g"),
                `![${tempImage.altText}](${uploadedImage.url})`
              );

              // Revoke the blob URL
              URL.revokeObjectURL(tempImage.tempUrl);
            } catch (err) {
              console.error("Failed to upload image for existing note:", err);
            }
          }
        }

        // Update the note with the new content
        if (updatedContent !== content) {
          noteData.content = updatedContent;
        }

        // Save the updated note
        await onSave(noteData);
        onCancel(); // Close the editor
        return;
      }

      // If no blob URLs, save normally
      if (blobUrls.length === 0) {
        await onSave(noteData);
        onCancel(); // Close the editor
        return;
      }

      // For new notes with blob URLs
      // Save the note first to get an ID
      const savedNote = await onSave(noteData);

      // If we have a saved note ID and blob URLs to process
      if (savedNote?.id && onAddImage) {
        // Find all temporary images that match our blob URLs
        const blobImages = tempImages.filter((img) => blobUrls.includes(img.tempUrl));

        if (blobImages.length > 0) {
          let updatedContent = content;

          // Process each blob image
          for (const blobImage of blobImages) {
            try {
              // Upload the image to the saved note
              const uploadedImage = await onAddImage(savedNote.id, blobImage.file);

              // Replace the blob URL with the actual URL in the content
              updatedContent = updatedContent.replace(
                new RegExp(`\\!\\[(.*?)\\]\\(${escapeRegExp(blobImage.tempUrl)}\\)`, "g"),
                `![$1](${uploadedImage.url})`
              );

              // Revoke the blob URL to free up memory
              URL.revokeObjectURL(blobImage.tempUrl);
            } catch (err) {
              console.error("Failed to upload temporary image:", err);
            }
          }

          // If content was updated with real URLs, update the note
          if (updatedContent !== content) {
            // Update the note with the new content that has real image URLs
            await onSave({
              ...noteData,
              content: updatedContent,
            });
          }

          // Clear temp images that were processed
          setTempImages((prev) => prev.filter((img) => !blobUrls.includes(img.tempUrl)));
        }
      }

      // Close the editor
      onCancel();
    } catch (error) {
      console.error("Failed to save note with images:", error);
      alert("There was an error saving your note with images. Please try again.");
    }
  };

  // Helper function to escape special characters in regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-2">
        <Input
          id="note-title-input"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold"
        />

        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} className="gap-1 px-2 py-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 rounded-full hover:bg-gray-200 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsTagDialogOpen(true)}
          >
            <Tag className="h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <div className="border rounded-md p-1 mb-3">
              <div className="flex flex-wrap items-center gap-1 p-1 border-b">
                <Button variant="ghost" size="sm" onClick={handleBold} title="Bold">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleItalic} title="Italic">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleH1} title="Heading 1">
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleH2} title="Heading 2">
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleBulletList} title="Bullet List">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNumberedList} title="Numbered List">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleQuote} title="Quote">
                  <Quote className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCode} title="Code Block">
                  <Code className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLink} title="Link">
                  <Link className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImageClick}
                  title="Image"
                  disabled={uploadingImage}
                  className={uploadingImage ? "relative" : ""}
                >
                  <ImageIcon className="h-4 w-4" />
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-full w-full bg-primary/20 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium">{uploadProgress}%</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              </div>

              <Textarea
                ref={textareaRef}
                placeholder="Write your note content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] p-3 font-mono text-sm focus:outline-none focus:ring-0 border-0"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="prose max-w-none dark:prose-invert">
            {content ? (
              <div className="border rounded-md p-4 min-h-[300px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => {
                      // Handle both blob URLs and regular URLs
                      const src = props.src as string;
                      const isBlobUrl = src && typeof src === "string" && src.startsWith("blob:");

                      // For debugging
                      if (isBlobUrl) {
                        console.log("Rendering blob URL in markdown:", src);
                      }

                      return (
                        <div className="my-4">
                          <img
                            {...props}
                            alt={props.alt || "Image"}
                            className="max-w-full h-auto rounded-md"
                            style={{ maxHeight: "400px" }}
                            onError={(e) => {
                              console.error("Image failed to load:", src);
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder-image.png"; // Fallback image
                              target.alt = "Failed to load image";
                              target.style.opacity = "0.5";
                            }}
                          />
                          {isBlobUrl && (
                            <div className="text-xs text-gray-500 mt-1">
                              (Temporary image - will be saved with the note)
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="border rounded-md p-4 min-h-[300px] text-gray-400 flex items-center justify-center">
                Nothing to preview
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {note && onDelete && (
            <Button variant="outline" onClick={() => onDelete(note.id)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </CardFooter>

      {/* Tag Dialog */}
      {isTagDialogOpen && (
        <Dialog isOpen={isTagDialogOpen} onClose={() => setIsTagDialogOpen(false)} title="Add Tag">
          <div className="mb-4">
            <Input
              placeholder="Enter tag name"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTag();
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </div>
        </Dialog>
      )}
    </Card>
  );
}
