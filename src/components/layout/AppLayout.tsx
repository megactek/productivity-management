"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useErrorBoundary } from "@/hooks";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAppNavigation } from "@/utils/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addTodo, todos, projects } = useAppDataContext();
  const { navigateToTodos } = useAppNavigation();
  const { ErrorBoundary } = useErrorBoundary();

  // Search functionality
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddTask = () => {
    setShowAddTaskDialog(true);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDueDate("");
  };

  const handleSubmitTask = async () => {
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await addTodo(taskTitle, taskDescription, taskDueDate || undefined, taskPriority);
      setShowAddTaskDialog(false);
      navigateToTodos();
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header onAddClick={handleAddTask} searchQuery={searchQuery} onSearchChange={handleSearchChange} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          todoCount={todos.filter((t) => t.status === "pending").length}
          projectCount={projects.filter((p) => p.status === "active").length}
          noteCount={5}
        />
        <ErrorBoundary
          fallback={
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
              <div className="text-center p-6 rounded-lg bg-destructive/10 max-w-md">
                <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
                <p className="mb-4">An error occurred while rendering this view. Please try refreshing the page.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
        >
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </ErrorBoundary>
      </div>

      {/* Quick Add Task Dialog */}
      <Dialog
        isOpen={showAddTaskDialog}
        onClose={() => setShowAddTaskDialog(false)}
        title="Add New Task"
        description="Quickly add a new task to your todo list"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Task description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input id="dueDate" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTask} disabled={!taskTitle.trim() || isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
