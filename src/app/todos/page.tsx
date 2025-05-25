"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TodoList } from "@/components/todo/TodoList";
import { Dialog } from "@/components/ui/Dialog";
import { TodoForm } from "@/components/todo/TodoForm";
import { useAppDataContext } from "@/context/AppDataContext";
import { Todo } from "@/types";
import { BackButton } from "@/components/ui/BackButton";

export default function TodosPage() {
  const { todos, loading, error, addTodo, updateTodo, deleteTodo, updateTodoStatus, projects } = useAppDataContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);
  const [initialStatus, setInitialStatus] = useState<"pending" | "in-progress" | "completed" | undefined>(undefined);

  const handleAddClick = (status?: "pending" | "in-progress" | "completed") => {
    setEditingTodo(undefined);
    setInitialStatus(status);
    setIsFormOpen(true);
  };

  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
    setInitialStatus(undefined);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Todo, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingTodo) {
        await updateTodo({
          ...editingTodo,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create the todo with default status (pending)
        const newTodo = await addTodo(data.title, data.description, data.dueDate, data.priority, data.projectId);

        // If initialStatus is specified and not 'pending', update the status
        if (initialStatus && initialStatus !== "pending") {
          await updateTodoStatus(newTodo.id, initialStatus);
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save todo:", err);
    }
  };

  const handleSubtaskToggle = async (todoId: string, subtaskId: string, completed: boolean) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo || !todo.subtasks) return;

    // Update the subtask
    const updatedSubtasks = todo.subtasks.map((st) =>
      st.id === subtaskId
        ? {
            ...st,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          }
        : st
    );

    // Calculate progress
    const progress =
      updatedSubtasks.length > 0
        ? Math.round((updatedSubtasks.filter((st) => st.completed).length / updatedSubtasks.length) * 100)
        : 0;

    // If all subtasks are completed, mark the todo as completed
    let status = todo.status;
    if (progress === 100 && updatedSubtasks.length > 0) {
      status = "completed";
    } else if (progress > 0 && status === "pending") {
      status = "in-progress";
    } else if (progress === 0 && status === "in-progress") {
      status = "pending";
    }

    // Update the todo
    await updateTodo({
      ...todo,
      subtasks: updatedSubtasks,
      progress,
      status,
      completedAt: status === "completed" ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <BackButton fallbackPath="/" label="Back to Dashboard" />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
          <p className="text-muted-foreground">Manage your tasks and stay organized.</p>
        </div>

        {error && <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>}

        <TodoList
          todos={todos}
          isLoading={loading}
          onStatusChange={updateTodoStatus}
          onEdit={handleEditClick}
          onDelete={deleteTodo}
          onAdd={handleAddClick}
          onSubtaskToggle={handleSubtaskToggle}
        />

        <Dialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingTodo ? "Edit Task" : "Add New Task"}
          description={editingTodo ? "Update the details of your task." : "Create a new task to track."}
          className="max-w-lg"
        >
          <TodoForm
            initialData={editingTodo}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isEditing={!!editingTodo}
            projects={projects}
          />
        </Dialog>
      </div>
    </AppLayout>
  );
}
