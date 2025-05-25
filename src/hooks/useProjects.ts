"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Milestone, Project, ProjectResource, ProjectRisk } from "@/types";
import { projectService } from "@/services/project";
import { useErrorHandler } from "./useErrorHandler";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { error, setError, clearError } = useErrorHandler();

  // Memoize filter functions for performance
  const activeProjects = useMemo(() => projects.filter((project) => project.status === "active"), [projects]);

  const planningProjects = useMemo(() => projects.filter((project) => project.status === "planning"), [projects]);

  const onHoldProjects = useMemo(() => projects.filter((project) => project.status === "on-hold"), [projects]);

  const completedProjects = useMemo(() => projects.filter((project) => project.status === "completed"), [projects]);

  const archivedProjects = useMemo(() => projects.filter((project) => project.status === "archived"), [projects]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      setError("Failed to fetch projects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clearError, setError]);

  // Refresh projects
  const refreshProjects = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
  }, []);

  // Load projects on mount and when refreshCounter changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, refreshCounter]);

  // Create a new project
  const createProject = useCallback(
    async (projectData: Omit<Project, "id" | "createdAt" | "todoIds" | "milestones" | "progress">) => {
      try {
        clearError();
        const newProject = await projectService.createProject(projectData);

        setProjects((prev) => [...prev, newProject]);
        return newProject;
      } catch (err) {
        setError("Failed to create project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update an existing project
  const updateProject = useCallback(
    async (id: string, updates: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) => {
      try {
        clearError();
        const updatedProject = await projectService.updateProject(id, updates);

        setProjects((prev) => prev.map((project) => (project.id === id ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to update project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Delete a project
  const deleteProject = useCallback(
    async (id: string) => {
      try {
        clearError();
        await projectService.deleteProject(id);
        setProjects((prev) => prev.filter((project) => project.id !== id));
      } catch (err) {
        setError("Failed to delete project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update project status
  const updateProjectStatus = useCallback(
    async (id: string, status: Project["status"]) => {
      try {
        clearError();
        const updatedProject = await projectService.updateProject(id, { status });

        setProjects((prev) => prev.map((project) => (project.id === id ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to update project status");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Add todo to project
  const addTodoToProject = useCallback(
    async (projectId: string, todoId: string) => {
      try {
        clearError();
        const updatedProject = await projectService.addTodoToProject(projectId, todoId);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to add todo to project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Remove todo from project
  const removeTodoFromProject = useCallback(
    async (projectId: string, todoId: string) => {
      try {
        clearError();
        const updatedProject = await projectService.removeTodoFromProject(projectId, todoId);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to remove todo from project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Add milestone to project
  const addMilestone = useCallback(
    async (projectId: string, milestoneData: Omit<Milestone, "id" | "createdAt" | "updatedAt">) => {
      try {
        clearError();
        const updatedProject = await projectService.addMilestone(projectId, milestoneData);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to add milestone to project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update milestone
  const updateMilestone = useCallback(
    async (projectId: string, milestoneId: string, milestoneData: Partial<Omit<Milestone, "id" | "createdAt">>) => {
      try {
        clearError();
        const updatedProject = await projectService.updateMilestone(projectId, milestoneId, milestoneData);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to update milestone");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Delete milestone
  const deleteMilestone = useCallback(
    async (projectId: string, milestoneId: string) => {
      try {
        clearError();
        const updatedProject = await projectService.deleteMilestone(projectId, milestoneId);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to delete milestone");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Add resource to project
  const addProjectResource = useCallback(
    async (projectId: string, resourceData: Omit<ProjectResource, "id" | "createdAt" | "updatedAt">) => {
      try {
        clearError();
        const updatedProject = await projectService.addProjectResource(projectId, resourceData);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to add resource to project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Delete resource from project
  const deleteProjectResource = useCallback(
    async (projectId: string, resourceId: string) => {
      try {
        clearError();
        const updatedProject = await projectService.deleteProjectResource(projectId, resourceId);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to delete resource from project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Add risk to project
  const addProjectRisk = useCallback(
    async (projectId: string, riskData: Omit<ProjectRisk, "id" | "createdAt" | "updatedAt">) => {
      try {
        clearError();
        const updatedProject = await projectService.addProjectRisk(projectId, riskData);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to add risk to project");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  // Update risk
  const updateProjectRisk = useCallback(
    async (projectId: string, riskId: string, riskData: Partial<Omit<ProjectRisk, "id" | "createdAt">>) => {
      try {
        clearError();
        const updatedProject = await projectService.updateProjectRisk(projectId, riskId, riskData);

        setProjects((prev) => prev.map((project) => (project.id === projectId ? updatedProject : project)));

        return updatedProject;
      } catch (err) {
        setError("Failed to update risk");
        console.error(err);
        throw err;
      }
    },
    [clearError, setError]
  );

  return {
    projects,
    activeProjects,
    planningProjects,
    onHoldProjects,
    completedProjects,
    archivedProjects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    addTodoToProject,
    removeTodoFromProject,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addProjectResource,
    deleteProjectResource,
    addProjectRisk,
    updateProjectRisk,
    refreshProjects,
  };
}
