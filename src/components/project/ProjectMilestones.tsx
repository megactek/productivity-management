"use client";

import { useState } from "react";
import { Milestone, Project } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Check, Calendar, Plus, Edit, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ProjectMilestonesProps {
  project: Project;
  onAddMilestone: (
    milestoneData: Omit<Milestone, "id" | "createdAt" | "updatedAt" | "todoIds" | "completed" | "completedAt">
  ) => void;
  onUpdateMilestone: (
    milestoneId: string,
    milestoneData: Partial<Omit<Milestone, "id" | "createdAt" | "updatedAt">>
  ) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  onCompleteMilestone: (milestoneId: string, completed: boolean) => void;
}

export function ProjectMilestones({
  project,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onCompleteMilestone,
}: ProjectMilestonesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState<{
    title: string;
    description: string;
    dueDate: string;
  }>({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
  });
  const [editMilestone, setEditMilestone] = useState<{
    title: string;
    description: string;
    dueDate: string;
  }>({
    title: "",
    description: "",
    dueDate: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMilestone.title.trim()) {
      onAddMilestone({
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim() || undefined,
        dueDate: newMilestone.dueDate ? new Date(newMilestone.dueDate).toISOString() : new Date().toISOString(),
      });
      setNewMilestone({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
      });
      setIsAdding(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editMilestone.title.trim()) {
      onUpdateMilestone(editingId, {
        title: editMilestone.title.trim(),
        description: editMilestone.description.trim() || undefined,
        dueDate: editMilestone.dueDate ? new Date(editMilestone.dueDate).toISOString() : undefined,
      });
      setEditingId(null);
    }
  };

  const startEdit = (milestone: Milestone) => {
    setEditMilestone({
      title: milestone.title,
      description: milestone.description || "",
      dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().split("T")[0] : "",
    });
    setEditingId(milestone.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleToggleComplete = (milestone: Milestone) => {
    onCompleteMilestone(milestone.id, !milestone.completed);
  };

  // Sort milestones by due date (incomplete first, then by date)
  const sortedMilestones = [...project.milestones].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Milestones</h3>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="flex items-center gap-1">
            <Plus size={16} />
            <span>Add Milestone</span>
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4">
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div>
              <label htmlFor="new-milestone-title" className="text-sm font-medium block mb-1">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="new-milestone-title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="Milestone title"
                required
              />
            </div>
            <div>
              <label htmlFor="new-milestone-description" className="text-sm font-medium block mb-1">
                Description
              </label>
              <Textarea
                id="new-milestone-description"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Milestone description"
                rows={2}
              />
            </div>
            <div>
              <label htmlFor="new-milestone-date" className="text-sm font-medium block mb-1">
                Due Date
              </label>
              <Input
                id="new-milestone-date"
                type="date"
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add Milestone
              </Button>
            </div>
          </form>
        </Card>
      )}

      {sortedMilestones.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">No milestones yet. Add one to track project progress.</p>
      )}

      <div className="space-y-3">
        {sortedMilestones.map((milestone) => (
          <Card key={milestone.id} className={`p-4 ${milestone.completed ? "bg-muted/50" : ""}`}>
            {editingId === milestone.id ? (
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label htmlFor={`edit-milestone-${milestone.id}-title`} className="text-sm font-medium block mb-1">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id={`edit-milestone-${milestone.id}-title`}
                    value={editMilestone.title}
                    onChange={(e) => setEditMilestone({ ...editMilestone, title: e.target.value })}
                    placeholder="Milestone title"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`edit-milestone-${milestone.id}-description`}
                    className="text-sm font-medium block mb-1"
                  >
                    Description
                  </label>
                  <Textarea
                    id={`edit-milestone-${milestone.id}-description`}
                    value={editMilestone.description}
                    onChange={(e) => setEditMilestone({ ...editMilestone, description: e.target.value })}
                    placeholder="Milestone description"
                    rows={2}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-milestone-${milestone.id}-date`} className="text-sm font-medium block mb-1">
                    Due Date
                  </label>
                  <Input
                    id={`edit-milestone-${milestone.id}-date`}
                    type="date"
                    value={editMilestone.dueDate}
                    onChange={(e) => setEditMilestone({ ...editMilestone, dueDate: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 h-5 w-5 rounded-full border cursor-pointer mt-1 
                    ${
                      milestone.completed
                        ? "bg-primary border-primary flex items-center justify-center"
                        : "border-input"
                    }`}
                  onClick={() => handleToggleComplete(milestone)}
                >
                  {milestone.completed && <Check size={12} className="text-primary-foreground" />}
                </div>
                <div className="flex-grow">
                  <h4 className={`font-medium ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
                    {milestone.title}
                  </h4>
                  {milestone.description && (
                    <p className={`text-sm mt-1 ${milestone.completed ? "text-muted-foreground" : ""}`}>
                      {milestone.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar size={14} />
                    <span>Due: {formatDate(milestone.dueDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(milestone)}
                    className="h-7 w-7"
                  >
                    <Edit size={15} className="text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteMilestone(milestone.id)}
                    className="h-7 w-7"
                  >
                    <Trash size={15} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
