"use client";

import { useState, useEffect } from "react";
import { Todo, Project, SubTask } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { generateId } from "@/lib/utils";
import Image from "next/image";

interface TodoFormProps {
  initialData?: Todo;
  onSubmit: (data: Omit<Todo, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  isEditing?: boolean;
  projects?: Project[];
}

export function TodoForm({ initialData, onSubmit, onCancel, isEditing = false, projects = [] }: TodoFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(initialData?.priority || "medium");
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed">(initialData?.status || "pending");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState<SubTask[]>(initialData?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // For image uploads (mock implementation, in a real app would handle actual file uploads)
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);

  useEffect(() => {
    if (isEditing && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : "");
      setPriority(initialData.priority);
      setProjectId(initialData.projectId || "");
      setStatus(initialData.status);
      setTags(initialData.tags || []);
      setSubtasks(initialData.subtasks || []);
      setExistingImages(initialData.images || []);
    }
  }, [initialData, isEditing]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (title.trim() === "") {
      newErrors.title = "Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // In a real app, we would upload the images here
    // and add them to the todo with URLs

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority,
      status,
      projectId: projectId || undefined,
      tags,
      subtasks,
      // Here we're just keeping the existing images since we're not actually uploading
      images: existingImages,
    });
  };

  // Handle adding a new subtask
  const handleAddSubtask = () => {
    if (newSubtask.trim() === "") return;

    const newSubtaskItem: SubTask = {
      id: generateId(),
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setSubtasks([...subtasks, newSubtaskItem]);
    setNewSubtask("");
  };

  // Handle removing a subtask
  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((subtask) => subtask.id !== id));
  };

  // Handle toggling subtask completion
  const handleToggleSubtask = (id: string, completed: boolean) => {
    setSubtasks(
      subtasks.map((subtask) =>
        subtask.id === id
          ? {
              ...subtask,
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
            }
          : subtask
      )
    );
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() === "" || tags.includes(tagInput.trim())) return;
    setTags([...tags, tagInput.trim()]);
    setTagInput("");
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Handle image selection (mock implementation)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to images state
      const newFiles = Array.from(e.target.files);
      setImages([...images, ...newFiles]);
    }
  };

  // Remove selected image (mock implementation)
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Remove existing image
  const handleRemoveExistingImage = (id: string) => {
    setExistingImages(existingImages.filter((img) => img.id !== id));
  };

  // Only show active projects in the dropdown
  const activeProjects = projects.filter((project) => project.status === "active");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {/* Basic Task Information */}
      <div className="space-y-2 w-full">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2 w-full">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
        />
      </div>

      {/* Due Date and Priority - Grid Layout */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="space-y-2">
          <label htmlFor="dueDate" className="text-sm font-medium">
            Due Date
          </label>
          <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <div className="flex space-x-1">
            <Button
              type="button"
              variant={priority === "low" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPriority("low")}
              className="flex-1"
            >
              Low
            </Button>
            <Button
              type="button"
              variant={priority === "medium" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPriority("medium")}
              className="flex-1"
            >
              Medium
            </Button>
            <Button
              type="button"
              variant={priority === "high" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPriority("high")}
              className="flex-1"
            >
              High
            </Button>
          </div>
        </div>
      </div>

      {/* Project Selection */}
      {activeProjects.length > 0 && (
        <div className="space-y-2 w-full">
          <label htmlFor="project" className="text-sm font-medium">
            Project
          </label>
          <Select
            id="project"
            value={projectId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProjectId(e.target.value)}
          >
            <option value="">None</option>
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Status Selection (only when editing) */}
      {isEditing && (
        <div className="space-y-2 w-full">
          <label className="text-sm font-medium">Status</label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={status === "pending" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatus("pending")}
              className="flex-1"
            >
              Pending
            </Button>
            <Button
              type="button"
              variant={status === "in-progress" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatus("in-progress")}
              className="flex-1"
            >
              In Progress
            </Button>
            <Button
              type="button"
              variant={status === "completed" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatus("completed")}
              className="flex-1"
            >
              Completed
            </Button>
          </div>
        </div>
      )}

      {/* Tags and Subtasks - Grid Layout */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Tags Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" onClick={handleAddTag} size="sm">
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subtasks */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Subtasks</label>

          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a subtask"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
            />
            <Button type="button" onClick={handleAddSubtask} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto pr-1">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group">
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={subtask.completed}
                    onCheckedChange={(checked) => handleToggleSubtask(subtask.id, checked === true)}
                  />
                  <label
                    htmlFor={`subtask-${subtask.id}`}
                    className={`text-sm flex-1 ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {subtask.title}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Upload (Mock Implementation) */}
      <div className="space-y-2 w-full">
        <label className="text-sm font-medium">Images</label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center"
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Images
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />

        {/* Display existing and selected images */}
        {(existingImages.length > 0 || images.length > 0) && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {/* Display existing images */}
            {existingImages.map((image) => (
              <div key={image.id} className="relative w-full aspect-square">
                <Image
                  src={image.thumbnail || image.url}
                  alt={image.name || "Task attachment"}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
                  onClick={() => handleRemoveExistingImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Display selected images (would be implemented in a real app) */}
            {images.map((file, index) => (
              <div key={index} className="relative w-full aspect-square">
                <div className="w-full h-full flex items-center justify-center border rounded bg-muted text-xs text-center p-1 overflow-hidden">
                  {file.name}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Update" : "Create"} Task</Button>
      </div>
    </form>
  );
}
