"use client";

import { useMemo } from "react";
import { Todo } from "@/types";
import { TodoItem } from "./TodoItem";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";

interface KanbanViewProps {
  todos: Todo[];
  onStatusChange: (id: string, status: "pending" | "in-progress" | "completed") => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onAdd: (status: "pending" | "in-progress" | "completed") => void;
  onSubtaskToggle?: (todoId: string, subtaskId: string, completed: boolean) => void;
}

export function KanbanView({ todos, onStatusChange, onEdit, onDelete, onAdd, onSubtaskToggle }: KanbanViewProps) {
  // Group todos by status
  const groupedTodos = useMemo(() => {
    const pending = todos.filter((todo) => todo.status === "pending");
    const inProgress = todos.filter((todo) => todo.status === "in-progress");
    const completed = todos.filter((todo) => todo.status === "completed");

    return { pending, inProgress, completed };
  }, [todos]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pending Column */}
      <KanbanColumn
        title="To Do"
        todos={groupedTodos.pending}
        status="pending"
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onAdd={() => onAdd("pending")}
        onSubtaskToggle={onSubtaskToggle}
      />

      {/* In Progress Column */}
      <KanbanColumn
        title="In Progress"
        todos={groupedTodos.inProgress}
        status="in-progress"
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onAdd={() => onAdd("in-progress")}
        onSubtaskToggle={onSubtaskToggle}
      />

      {/* Completed Column */}
      <KanbanColumn
        title="Completed"
        todos={groupedTodos.completed}
        status="completed"
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onAdd={() => onAdd("completed")}
        onSubtaskToggle={onSubtaskToggle}
      />
    </div>
  );
}

interface KanbanColumnProps {
  title: string;
  todos: Todo[];
  status: "pending" | "in-progress" | "completed";
  onStatusChange: (id: string, status: "pending" | "in-progress" | "completed") => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onSubtaskToggle?: (todoId: string, subtaskId: string, completed: boolean) => void;
}

function KanbanColumn({
  title,
  todos,
  status,
  onStatusChange,
  onEdit,
  onDelete,
  onAdd,
  onSubtaskToggle,
}: KanbanColumnProps) {
  // Sort todos by priority and due date
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      // First by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todos]);

  const columnColor =
    status === "pending"
      ? "bg-slate-50 border-slate-200"
      : status === "in-progress"
      ? "bg-blue-50 border-blue-200"
      : "bg-green-50 border-green-200";

  return (
    <div className={cn("rounded-lg border p-4 flex flex-col h-[calc(100vh-14rem)] min-h-[500px]", columnColor)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">
          {title} ({sortedTodos.length})
        </h3>
        <button onClick={onAdd} className="text-muted-foreground hover:text-foreground transition-colors">
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedTodos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No tasks</div>
        ) : (
          sortedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubtaskToggle={onSubtaskToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
