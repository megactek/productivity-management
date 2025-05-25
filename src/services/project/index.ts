import { ProjectService } from "./projectService";

// Create a singleton instance of the project service
export const projectService = new ProjectService();

// Re-export the service
export * from "./projectService";
