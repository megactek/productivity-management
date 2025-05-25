import { Todo } from "@/types";
import { storageService } from "../storage";
import { generateId } from "@/lib/utils";

/**
 * TodoService handles all todo-related operations
 */
export class TodoService {
  /**
   * Get all todos
   */
  async getTodos(): Promise<Todo[]> {
    try {
      return await storageService.read<Todo[]>("todos");
    } catch (error) {
      console.error("Error in getTodos:", error);
      return [];
    }
  }

  /**
   * Get a specific todo by ID
   */
  async getTodoById(id: string): Promise<Todo | null> {
    try {
      const todos = await this.getTodos();
      return todos.find((todo) => todo.id === id) || null;
    } catch (error) {
      console.error(`Error getting todo ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new todo
   */
  async createTodo(todoData: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo> {
    try {
      // Validate the todo
      this.validateTodo(todoData);

      const todos = await this.getTodos();

      const newTodo: Todo = {
        id: generateId(),
        ...todoData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the new todo
      todos.push(newTodo);

      // Save to storage
      await storageService.write("todos", todos);

      return newTodo;
    } catch (error) {
      console.error("Error creating todo:", error);
      throw error;
    }
  }

  /**
   * Update an existing todo
   */
  async updateTodo(id: string, todoData: Partial<Omit<Todo, "id" | "createdAt">>): Promise<Todo> {
    try {
      const todos = await this.getTodos();
      const index = todos.findIndex((todo) => todo.id === id);

      if (index === -1) {
        throw new Error(`Todo with id ${id} not found`);
      }

      // Create the updated todo
      const updatedTodo: Todo = {
        ...todos[index],
        ...todoData,
        updatedAt: new Date().toISOString(),
      };

      // Validate the updated todo
      this.validateTodo(updatedTodo);

      // Update the todo in the array
      todos[index] = updatedTodo;

      // Save to storage
      await storageService.write("todos", todos);

      return updatedTodo;
    } catch (error) {
      console.error(`Error updating todo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a todo
   */
  async deleteTodo(id: string): Promise<boolean> {
    try {
      const todos = await this.getTodos();
      const filteredTodos = todos.filter((todo) => todo.id !== id);

      if (filteredTodos.length === todos.length) {
        throw new Error(`Todo with id ${id} not found`);
      }

      // Save to storage
      await storageService.write("todos", filteredTodos);

      return true;
    } catch (error) {
      console.error(`Error deleting todo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update todo status
   */
  async updateTodoStatus(id: string, status: "pending" | "in-progress" | "completed"): Promise<Todo> {
    return this.updateTodo(id, { status });
  }

  /**
   * Get todos by project
   */
  async getTodosByProject(projectId: string): Promise<Todo[]> {
    try {
      const todos = await this.getTodos();
      return todos.filter((todo) => todo.projectId === projectId);
    } catch (error) {
      console.error(`Error getting todos for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Get todos by status
   */
  async getTodosByStatus(status: "pending" | "in-progress" | "completed"): Promise<Todo[]> {
    try {
      const todos = await this.getTodos();
      return todos.filter((todo) => todo.status === status);
    } catch (error) {
      console.error(`Error getting todos with status ${status}:`, error);
      return [];
    }
  }

  /**
   * Get overdue todos
   */
  async getOverdueTodos(): Promise<Todo[]> {
    try {
      const todos = await this.getTodos();
      const now = new Date();

      return todos.filter((todo) => {
        if (!todo.dueDate || todo.status === "completed") {
          return false;
        }

        const dueDate = new Date(todo.dueDate);
        return dueDate < now;
      });
    } catch (error) {
      console.error("Error getting overdue todos:", error);
      return [];
    }
  }

  /**
   * Validate a todo
   */
  private validateTodo(todo: Partial<Todo>): void {
    // Title is required
    if (!todo.title || todo.title.trim().length === 0) {
      throw new Error("Todo title is required");
    }

    // Title max length
    if (todo.title.length > 100) {
      throw new Error("Todo title must be 100 characters or less");
    }

    // Description max length
    if (todo.description && todo.description.length > 500) {
      throw new Error("Todo description must be 500 characters or less");
    }

    // Due date must be valid
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error("Invalid due date");
      }
    }

    // Validate subtasks
    if (todo.subtasks && !Array.isArray(todo.subtasks)) {
      throw new Error("Subtasks must be an array");
    }

    // Validate tags
    if (todo.tags && !Array.isArray(todo.tags)) {
      throw new Error("Tags must be an array");
    }

    // Validate images
    if (todo.images && !Array.isArray(todo.images)) {
      throw new Error("Images must be an array");
    }

    // Validate status
    if (todo.status && !["pending", "in-progress", "completed"].includes(todo.status)) {
      throw new Error("Invalid status");
    }

    // Validate priority
    if (todo.priority && !["low", "medium", "high"].includes(todo.priority)) {
      throw new Error("Invalid priority");
    }
  }
}
