import { Milestone, Project, ProjectResource, ProjectRisk, Todo } from "@/types";
import { storageService } from "../storage";
import { todoService } from "../todo";
import { generateId } from "@/lib/utils";

/**
 * ProjectService handles all project-related operations
 */
export class ProjectService {
  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    try {
      return await storageService.read<Project[]>("projects");
    } catch (error) {
      console.error("Error in getProjects:", error);
      return [];
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const projects = await this.getProjects();
      return projects.find((project) => project.id === id) || null;
    } catch (error) {
      console.error(`Error getting project ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new project
   */
  async createProject(
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "todoIds" | "progress" | "milestones"> & {
      initialMilestones?: Array<{ title: string; description?: string; dueDate?: string }>;
    }
  ): Promise<Project> {
    try {
      console.log("Creating project with data:", JSON.stringify(projectData, null, 2));

      const { initialMilestones, ...data } = projectData;

      // Ensure we have the necessary fields
      const now = new Date().toISOString();
      const newProject: Project = {
        id: generateId(),
        name: data.name,
        description: data.description || "",
        status: data.status || "planning",
        color: data.color || "#3b82f6", // Default blue
        startDate: data.startDate || now,
        todoIds: [],
        progress: 0,
        milestones: [],
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields if they exist
      if (data.dueDate) newProject.dueDate = data.dueDate;
      if (data.owner) newProject.owner = data.owner;
      if (data.tags) newProject.tags = data.tags;

      // Validate the project data
      this.validateProject(newProject);

      // Add initial milestones if provided
      if (initialMilestones && Array.isArray(initialMilestones)) {
        initialMilestones.forEach((milestoneData) => {
          const milestone: Milestone = {
            id: generateId(),
            title: milestoneData.title,
            description: milestoneData.description || "",
            dueDate: milestoneData.dueDate || "",
            completed: false,
            todoIds: [],
            createdAt: now,
            updatedAt: now,
          };
          newProject.milestones.push(milestone);
        });
      }

      // Get existing projects
      const projects = await this.getProjects();
      console.log("Current projects count before adding:", projects.length);

      // Add new project
      projects.push(newProject);

      // Save to storage
      await storageService.write("projects", projects);

      // Verify the project was saved
      const updatedProjects = await this.getProjects();
      console.log("Projects count after adding:", updatedProjects.length);
      const savedProject = updatedProjects.find((p) => p.id === newProject.id);
      if (!savedProject) {
        console.error("Project was not found after saving!");
      } else {
        console.log("Project saved successfully with ID:", savedProject.id);
      }

      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    try {
      const projects = await this.getProjects();
      const index = projects.findIndex((project) => project.id === id);

      if (index === -1) {
        throw new Error(`Project with id ${id} not found`);
      }

      // Create the updated project
      const updatedProject: Project = {
        ...projects[index],
        ...projectData,
        id,
        createdAt: projects[index].createdAt,
        updatedAt: new Date().toISOString(),
      };

      // Validate the updated project
      this.validateProject(updatedProject);

      // Update the project in the array
      projects[index] = updatedProject;

      // Save to storage
      await storageService.write("projects", projects);

      return updatedProject;
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const projects = await this.getProjects();
      const filteredProjects = projects.filter((project) => project.id !== id);

      if (filteredProjects.length === projects.length) {
        throw new Error(`Project with id ${id} not found`);
      }

      // Save to storage
      await storageService.write("projects", filteredProjects);

      return true;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a todo to a project
   */
  async addTodoToProject(projectId: string, todoId: string): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      // Check if todo exists
      const todo = await todoService.getTodoById(todoId);
      if (!todo) {
        throw new Error(`Todo with id ${todoId} not found`);
      }

      // Check if todo is already in the project
      if (project.todoIds.includes(todoId)) {
        return project;
      }

      // Add todo to project
      const updatedTodoIds = [...project.todoIds, todoId];

      // Update the todo to link it to the project
      await todoService.updateTodo(todoId, { projectId });

      // Update project progress
      await this.updateProjectProgress(projectId);

      // Save the updated project
      return this.updateProject(projectId, { todoIds: updatedTodoIds });
    } catch (error) {
      console.error(`Error adding todo ${todoId} to project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a todo from a project
   */
  async removeTodoFromProject(projectId: string, todoId: string): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      // Check if todo is in the project
      if (!project.todoIds.includes(todoId)) {
        return project;
      }

      // Remove todo from project
      const updatedTodoIds = project.todoIds.filter((id) => id !== todoId);

      // Update the todo to unlink it from the project
      const todo = await todoService.getTodoById(todoId);
      if (todo && todo.projectId === projectId) {
        await todoService.updateTodo(todoId, { projectId: undefined });
      }

      // Update project progress
      await this.updateProjectProgress(projectId);

      // Save the updated project
      return this.updateProject(projectId, { todoIds: updatedTodoIds });
    } catch (error) {
      console.error(`Error removing todo ${todoId} from project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Update project progress based on completed todos
   */
  async updateProjectProgress(projectId: string): Promise<number> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      // No todos means 0% progress
      if (project.todoIds.length === 0) {
        await this.updateProject(projectId, { progress: 0 });
        return 0;
      }

      // Get all todos for this project
      const projectTodos = await todoService.getTodosByProject(projectId);

      // Count completed todos
      const completedTodos = projectTodos.filter((todo) => todo.status === "completed").length;

      // Calculate progress percentage
      const progress = Math.round((completedTodos / project.todoIds.length) * 100);

      // Update the project
      await this.updateProject(projectId, { progress });

      return progress;
    } catch (error) {
      console.error(`Error updating progress for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get all todos for a project
   */
  async getProjectTodos(projectId: string): Promise<Todo[]> {
    try {
      return await todoService.getTodosByProject(projectId);
    } catch (error) {
      console.error(`Error getting todos for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Add a milestone to a project
   */
  async addMilestone(
    projectId: string,
    milestoneData: Omit<Milestone, "id" | "createdAt" | "updatedAt">
  ): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      const newMilestone: Milestone = {
        id: generateId(),
        ...milestoneData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedMilestones = [...project.milestones, newMilestone];

      return this.updateProject(projectId, { milestones: updatedMilestones });
    } catch (error) {
      console.error(`Error adding milestone to project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Update a milestone in a project
   */
  async updateMilestone(
    projectId: string,
    milestoneId: string,
    milestoneData: Partial<Omit<Milestone, "id" | "createdAt">>
  ): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      const milestoneIndex = project.milestones.findIndex((m) => m.id === milestoneId);

      if (milestoneIndex === -1) {
        throw new Error(`Milestone with id ${milestoneId} not found`);
      }

      const updatedMilestone: Milestone = {
        ...project.milestones[milestoneIndex],
        ...milestoneData,
        updatedAt: new Date().toISOString(),
      };

      const updatedMilestones = [...project.milestones];
      updatedMilestones[milestoneIndex] = updatedMilestone;

      return this.updateProject(projectId, { milestones: updatedMilestones });
    } catch (error) {
      console.error(`Error updating milestone ${milestoneId} in project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a milestone from a project
   */
  async deleteMilestone(projectId: string, milestoneId: string): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      const updatedMilestones = project.milestones.filter((m) => m.id !== milestoneId);

      if (updatedMilestones.length === project.milestones.length) {
        throw new Error(`Milestone with id ${milestoneId} not found`);
      }

      return this.updateProject(projectId, { milestones: updatedMilestones });
    } catch (error) {
      console.error(`Error deleting milestone ${milestoneId} from project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Add a resource to a project
   */
  async addProjectResource(
    projectId: string,
    resourceData: Omit<ProjectResource, "id" | "createdAt" | "updatedAt">
  ): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      const newResource: ProjectResource = {
        id: generateId(),
        ...resourceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const resources = project.resources || [];
      const updatedResources = [...resources, newResource];

      return this.updateProject(projectId, { resources: updatedResources });
    } catch (error) {
      console.error(`Error adding resource to project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a resource from a project
   */
  async deleteProjectResource(projectId: string, resourceId: string): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project || !project.resources) {
        throw new Error(`Project with id ${projectId} not found or has no resources`);
      }

      const updatedResources = project.resources.filter((r) => r.id !== resourceId);

      if (updatedResources.length === project.resources.length) {
        throw new Error(`Resource with id ${resourceId} not found`);
      }

      return this.updateProject(projectId, { resources: updatedResources });
    } catch (error) {
      console.error(`Error deleting resource ${resourceId} from project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Add a risk to a project
   */
  async addProjectRisk(
    projectId: string,
    riskData: Omit<ProjectRisk, "id" | "createdAt" | "updatedAt">
  ): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      const newRisk: ProjectRisk = {
        id: generateId(),
        ...riskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const risks = project.risks || [];
      const updatedRisks = [...risks, newRisk];

      return this.updateProject(projectId, { risks: updatedRisks });
    } catch (error) {
      console.error(`Error adding risk to project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Update a risk in a project
   */
  async updateProjectRisk(
    projectId: string,
    riskId: string,
    riskData: Partial<Omit<ProjectRisk, "id" | "createdAt">>
  ): Promise<Project> {
    try {
      const project = await this.getProjectById(projectId);

      if (!project || !project.risks) {
        throw new Error(`Project with id ${projectId} not found or has no risks`);
      }

      const riskIndex = project.risks.findIndex((r) => r.id === riskId);

      if (riskIndex === -1) {
        throw new Error(`Risk with id ${riskId} not found`);
      }

      const updatedRisk: ProjectRisk = {
        ...project.risks[riskIndex],
        ...riskData,
        updatedAt: new Date().toISOString(),
      };

      const updatedRisks = [...project.risks];
      updatedRisks[riskIndex] = updatedRisk;

      return this.updateProject(projectId, { risks: updatedRisks });
    } catch (error) {
      console.error(`Error updating risk ${riskId} in project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Validate a project
   */
  private validateProject(project: Partial<Project>): void {
    // Name is required
    if (!project.name || project.name.trim().length === 0) {
      throw new Error("Project name is required");
    }

    // Name max length
    if (project.name.length > 100) {
      throw new Error("Project name must be 100 characters or less");
    }

    // Description max length
    if (project.description && project.description.length > 500) {
      throw new Error("Project description must be 500 characters or less");
    }

    // Due date must be valid
    if (project.dueDate) {
      const dueDate = new Date(project.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error("Invalid due date");
      }
    }

    // Start date must be valid
    if (project.startDate) {
      const startDate = new Date(project.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error("Invalid start date");
      }
    }

    // Start date must be before due date
    if (project.startDate && project.dueDate) {
      const startDate = new Date(project.startDate);
      const dueDate = new Date(project.dueDate);
      if (startDate > dueDate) {
        throw new Error("Start date must be before due date");
      }
    }

    // Validate status
    if (project.status && !["planning", "active", "on-hold", "completed", "archived"].includes(project.status)) {
      throw new Error("Invalid project status");
    }
  }
}
