"use client";

import { useState } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  Trash2,
  Edit,
  Image as ImageIcon,
  AlertTriangle,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Todo } from "@/types";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Checkbox } from "@/components/ui/Checkbox";
import Image from "next/image";

interface TodoItemProps {
  todo: Todo;
  onStatusChange: (id: string, status: "pending" | "in-progress" | "completed") => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onSubtaskToggle?: (todoId: string, subtaskId: string, completed: boolean) => void;
}

export function TodoItem({ todo, onStatusChange, onEdit, onDelete, onSubtaskToggle }: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = todo.status === "completed";
  const overdue = todo.dueDate ? isOverdue(todo.dueDate) : false;
  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const hasImages = todo.images && todo.images.length > 0;

  // Calculate progress
  const progress =
    todo.progress ??
    (hasSubtasks && todo.subtasks
      ? Math.round((todo.subtasks.filter((st) => st.completed).length / todo.subtasks.length) * 100)
      : isCompleted
      ? 100
      : 0);

  // Handle subtask toggle
  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    onSubtaskToggle?.(todo.id, subtaskId, completed);
  };

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-lg border p-3 animate-fade-in transition-all",
        isCompleted && "bg-muted/50",
        !isCompleted && overdue && "border-destructive",
        isExpanded && "shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={() => onStatusChange(todo.id, isCompleted ? "pending" : "completed")}
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium truncate", isCompleted && "line-through text-muted-foreground")}>
              {todo.title}
            </span>

            {/* Priority Badge */}
            {todo.priority && (
              <Badge
                variant={todo.priority === "high" ? "destructive" : todo.priority === "medium" ? "default" : "outline"}
                className="text-xs"
              >
                {todo.priority === "high" && <Flag className="h-3 w-3 mr-1" />}
                {todo.priority}
              </Badge>
            )}

            {/* Project Badge */}
            {todo.projectId && (
              <Badge variant="secondary" className="text-xs">
                Project
              </Badge>
            )}

            {/* Status Badge for in-progress */}
            {todo.status === "in-progress" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">
                In Progress
              </Badge>
            )}
          </div>

          {todo.description && (
            <div
              className={cn("text-xs text-muted-foreground truncate mt-0.5 max-w-xs", isCompleted && "line-through")}
            >
              {todo.description}
            </div>
          )}

          {/* Tags */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {todo.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Due Date */}
        {todo.dueDate && (
          <div
            className={cn(
              "hidden sm:flex items-center text-xs gap-1",
              overdue && !isCompleted ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{formatDate(new Date(todo.dueDate))}</span>
            {overdue && !isCompleted && <AlertTriangle className="h-3 w-3 text-destructive" />}
          </div>
        )}

        {/* Expand/Collapse button if todo has subtasks or images */}
        {(hasSubtasks || hasImages) && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(todo)}>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDelete(todo.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {hasSubtasks && todo.subtasks && (
        <div className="w-full px-8">
          <Progress value={progress} className="h-1" />
          <div className="text-xs text-muted-foreground mt-0.5">
            {todo.subtasks.filter((st) => st.completed).length} of {todo.subtasks.length} subtasks
          </div>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 pl-8 space-y-2">
          {/* Subtasks */}
          {hasSubtasks && todo.subtasks && (
            <div className="space-y-1">
              {todo.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={subtask.completed}
                    onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, checked === true)}
                    disabled={isCompleted}
                  />
                  <label
                    htmlFor={`subtask-${subtask.id}`}
                    className={cn("text-sm", subtask.completed && "line-through text-muted-foreground")}
                  >
                    {subtask.title}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Image Previews */}
          {hasImages && todo.images && (
            <div className="flex flex-wrap gap-2 mt-2">
              {todo.images.map((image) => (
                <div key={image.id} className="relative w-16 h-16 rounded overflow-hidden border">
                  <ImageIcon className="h-4 w-4 absolute top-1 right-1 text-white bg-black/40 rounded-full p-0.5" />
                  <Image
                    src={image.url}
                    alt={image.name || "Task attachment"}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
