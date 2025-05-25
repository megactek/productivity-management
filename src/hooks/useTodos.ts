"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Todo, SubTask, TodoImage } from "@/types";
import { todoService } from "@/services/todo";
import { useErrorHandler } from "./useErrorHandler";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { error, setError, clearError } = useErrorHandler();

  // Memoize filter functions for performance
  const pendingTodos = useMemo(() => todos.filter((todo) => todo.status !== "completed"), [todos]);

  const completedTodos = useMemo(() => todos.filter((todo) => todo.status === "completed"), [todos]);

  const overdueTodos = useMemo(
    () =>
      todos.filter((todo) => {
        if (!todo.dueDate || todo.status === "completed") return false;
        return new Date(todo.dueDate) < new Date();
      }),
    [todos]
  );

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await todoService.getTodos();
      setTodos(data);
    } catch (err) {
      setError("Failed to fetch todos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clearError, setError]);

  // Refresh todos
  const refreshTodos = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  // Load todos on mount and when refreshCounter changes
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos, refreshCounter]);

  // Add a new todo
  const addTodo = useCallback(
    async (
      title: string,
      description?: string,
      dueDate?: string,
      priority: "low" | "medium" | "high" = "medium",
      projectId?: string,
      status: "pending" | "in-progress" | "completed" = "pending",
      subtasks?: SubTask[],
      tags?: string[],
      images?: TodoImage[]
    ) => {
      try {
        clearError();
        const newTodo = await todoService.createTodo({
          title,
          description,
          dueDate,
          priority,
          projectId,
          status,
          subtasks,
          tags,
          images,
        });

        setTodos((prev) => [...prev, newTodo]);
        return newTodo;
      } catch (err) {
        setError("Failed to add todo");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update an existing todo
  const updateTodo = useCallback(
    async (updatedTodo: Todo) => {
      try {
        clearError();
        const result = await todoService.updateTodo(updatedTodo.id, updatedTodo);

        setTodos((prev) => prev.map((todo) => (todo.id === result.id ? result : todo)));

        return result;
      } catch (err) {
        setError("Failed to update todo");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Delete a todo
  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        clearError();
        await todoService.deleteTodo(id);
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
      } catch (err) {
        setError("Failed to delete todo");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update todo status
  const updateTodoStatus = useCallback(
    async (id: string, status: "pending" | "in-progress" | "completed") => {
      try {
        clearError();
        const updatedTodo = await todoService.updateTodoStatus(id, status);

        setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)));

        return updatedTodo;
      } catch (err) {
        setError("Failed to update todo status");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Get todos by project
  const getTodosByProject = useCallback(
    async (projectId: string) => {
      try {
        clearError();
        return await todoService.getTodosByProject(projectId);
      } catch (err) {
        setError("Failed to get todos for project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  return {
    todos,
    pendingTodos,
    completedTodos,
    overdueTodos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    refreshTodos,
    getTodosByProject,
  };
}
