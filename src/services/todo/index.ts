import { TodoService } from "./todoService";

// Create a singleton instance of the todo service
export const todoService = new TodoService();

// Re-export the service
export * from "./todoService";
