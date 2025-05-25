"use client";

import { useState } from "react";
import { Todo } from "@/types";
import { TodoItem } from "./TodoItem";
import { KanbanView } from "./KanbanView";
import { TodoMetrics } from "./TodoMetrics";
import { Button } from "@/components/ui/Button";
import { Plus, List, Columns, BarChart, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface TodoListProps {
  todos: Todo[];
  isLoading?: boolean;
  onStatusChange: (id: string, status: "pending" | "in-progress" | "completed") => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onAdd: (status?: "pending" | "in-progress" | "completed") => void;
  onSubtaskToggle?: (todoId: string, subtaskId: string, completed: boolean) => void;
}

type ViewMode = "list" | "kanban";
type FilterMode = "all" | "active" | "completed";
type SortMode = "dueDate" | "priority" | "createdAt" | "title";

export function TodoList({
  todos,
  isLoading = false,
  onStatusChange,
  onEdit,
  onDelete,
  onAdd,
  onSubtaskToggle,
}: TodoListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sortBy, setSortBy] = useState<SortMode>("dueDate");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMetrics, setShowMetrics] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  // Apply filters
  const filteredTodos = todos.filter((todo) => {
    // Status filter
    if (filter === "active" && todo.status === "completed") return false;
    if (filter === "completed" && todo.status !== "completed") return false;

    // Priority filter
    if (priorityFilter !== "all" && todo.priority !== priorityFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = todo.title.toLowerCase().includes(query);
      const matchesDescription = todo.description?.toLowerCase().includes(query) || false;
      const matchesTags = todo.tags?.some((tag) => tag.toLowerCase().includes(query)) || false;

      if (!matchesTitle && !matchesDescription && !matchesTags) return false;
    }

    return true;
  });

  // Sort todos
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // Always put completed items at the bottom
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    // Apply selected sort
    switch (sortBy) {
      case "dueDate":
        // Sort by due date (items with due dates first, then sort by due date)
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        // Fall through to creation date if no due dates
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      case "priority":
        // Sort by priority (high to low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];

      case "createdAt":
        // Sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      case "title":
        // Sort by title alphabetically
        return a.title.localeCompare(b.title);

      default:
        return 0;
    }
  });

  // Handle adding a new todo
  const handleAdd = (status?: "pending" | "in-progress" | "completed") => {
    onAdd(status);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortMode)}
            className="w-32"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Created</option>
            <option value="title">Title</option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPriorityFilter(e.target.value as "all" | "high" | "medium" | "low")
            }
            className="w-28"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>

          <Button onClick={() => setShowMetrics(!showMetrics)} variant="outline" size="icon" title="Toggle Metrics">
            <BarChart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && <TodoMetrics todos={todos} />}

      {/* View and Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button variant={filter === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "active" ? "secondary" : "ghost"} size="sm" onClick={() => setFilter("active")}>
            Active
          </Button>
          <Button
            variant={filter === "completed" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            title="Kanban View"
          >
            <Columns className="h-4 w-4" />
          </Button>

          <Button onClick={() => handleAdd()} size="sm" className="space-x-1 ml-2">
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : sortedTodos.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {filter === "all"
            ? "You don't have any tasks yet. Add one to get started!"
            : filter === "active"
            ? "You don't have any active tasks."
            : "You don't have any completed tasks."}
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="space-y-2">
              {sortedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSubtaskToggle={onSubtaskToggle}
                />
              ))}
            </div>
          ) : (
            <KanbanView
              todos={todos}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={handleAdd}
              onSubtaskToggle={onSubtaskToggle}
            />
          )}
        </>
      )}
    </div>
  );
}
