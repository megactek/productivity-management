"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { X, Plus } from "lucide-react";

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "todoIds" | "progress">) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface InitialMilestone {
  title: string;
  description?: string;
  dueDate: string;
}

export function ProjectForm({ initialData, onSubmit, onCancel, isEditing = false }: ProjectFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : ""
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState<Project["status"]>(initialData?.status || "planning");
  const [color, setColor] = useState(initialData?.color || "#3b82f6"); // Default blue
  const [owner, setOwner] = useState(initialData?.owner || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [initialMilestones, setInitialMilestones] = useState<InitialMilestone[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditing && initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "");
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : "");
      setStatus(initialData.status);
      setColor(initialData.color || "#3b82f6");
      setOwner(initialData.owner || "");
      setTags(initialData.tags || []);
    }
  }, [initialData, isEditing]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (name.trim() === "") {
      newErrors.name = "Project name is required";
    }

    // Validate dates if provided
    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        newErrors.dueDate = "Due date cannot be before start date";
      }
    }

    // Validate milestones
    initialMilestones.forEach((milestone, index) => {
      if (!milestone.title.trim()) {
        newErrors[`milestone-${index}-title`] = "Milestone title is required";
      }
      if (milestone.dueDate && dueDate) {
        const milestoneDate = new Date(milestone.dueDate);
        const projectDueDate = new Date(dueDate);
        if (milestoneDate > projectDueDate) {
          newErrors[`milestone-${index}-dueDate`] = "Milestone due date cannot be after project due date";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Create partial milestone objects - the service will add the required fields
    const projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "todoIds" | "progress"> = {
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
      color: color || undefined,
      owner: owner.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      milestones: [], // Will be populated by the service
    };

    // The milestone data will be processed by the project service
    if (initialMilestones.length > 0) {
      // @ts-expect-error - We're letting the service handle the proper milestone creation
      projectData.initialMilestones = initialMilestones.map((milestone) => ({
        title: milestone.title.trim(),
        description: milestone.description?.trim(),
        dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : new Date().toISOString(),
      }));
    }

    onSubmit(projectData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddMilestone = () => {
    setInitialMilestones([
      ...initialMilestones,
      {
        title: "",
        description: "",
        dueDate: dueDate || new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setInitialMilestones(initialMilestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof InitialMilestone, value: string) => {
    const updatedMilestones = [...initialMilestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    };
    setInitialMilestones(updatedMilestones);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Project Information */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Project Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter project description"
          rows={2}
        />
      </div>

      {/* Project Dates and Status - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            Start Date
          </label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label htmlFor="dueDate" className="text-sm font-medium">
            Due Date
          </label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={errors.dueDate ? "border-destructive" : ""}
          />
          {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
        </div>
      </div>

      {/* Project Details - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="owner" className="text-sm font-medium">
            Project Owner
          </label>
          <Input
            id="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Enter project owner"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select
            id="status"
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as Project["status"])}
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>

      {/* Project Color and Tags - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="color" className="text-sm font-medium">
            Project Color
          </label>
          <div className="flex items-center space-x-2">
            <Input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 p-1"
            />
            <span className="text-sm">{color}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags
          </label>
          <div className="flex items-center space-x-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive focus:outline-none"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Initial Milestones - Only shown when creating new projects */}
      {!isEditing && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Initial Milestones</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMilestone}
              className="flex items-center"
            >
              <Plus size={16} className="mr-1" /> Add Milestone
            </Button>
          </div>

          {initialMilestones.length > 0 && (
            <div className="space-y-3 mt-2">
              {initialMilestones.map((milestone, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(index)}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                  >
                    <X size={16} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Title <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={milestone.title}
                        onChange={(e) => handleMilestoneChange(index, "title", e.target.value)}
                        placeholder="Milestone title"
                        className={errors[`milestone-${index}-title`] ? "border-destructive" : ""}
                      />
                      {errors[`milestone-${index}-title`] && (
                        <p className="text-xs text-destructive">{errors[`milestone-${index}-title`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => handleMilestoneChange(index, "dueDate", e.target.value)}
                        className={errors[`milestone-${index}-dueDate`] ? "border-destructive" : ""}
                      />
                      {errors[`milestone-${index}-dueDate`] && (
                        <p className="text-xs text-destructive">{errors[`milestone-${index}-dueDate`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={milestone.description || ""}
                      onChange={(e) => handleMilestoneChange(index, "description", e.target.value)}
                      placeholder="Milestone description"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Update" : "Create"} Project</Button>
      </div>
    </form>
  );
}
