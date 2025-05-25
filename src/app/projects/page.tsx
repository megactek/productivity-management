"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dialog } from "@/components/ui/Dialog";
import { useAppDataContext } from "@/context/AppDataContext";
import { Project } from "@/types";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/project/ProjectForm";
import { ProjectList } from "@/components/project/ProjectList";

export default function ProjectsPage() {
  const { projects, loading, error, createProject, updateProject, deleteProject, updateProjectStatus } =
    useAppDataContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingProject(undefined);
    setIsFormOpen(true);
    setFormError(null);
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
    setFormError(null);
  };

  const handleFormSubmit = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "todoIds" | "progress">) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingProject) {
        await updateProject(editingProject.id, data);
      } else {
        // Add required fields for project creation
        const projectData: Omit<Project, "id" | "createdAt" | "todoIds"> = {
          ...data,
          progress: 0,
          updatedAt: new Date().toISOString(),
        };
        await createProject(projectData);
      }

      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save project:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track progress.</p>
        </div>

        {error && <div className="rounded-lg bg-destructive/15 p-4 text-destructive">{error}</div>}

        <div className="flex justify-end">
          <Button onClick={handleAddClick}>Create Project</Button>
        </div>

        <ProjectList
          projects={projects}
          isLoading={loading}
          onStatusChange={updateProjectStatus}
          onEdit={handleEditClick}
          onDelete={deleteProject}
        />

        <Dialog
          isOpen={isFormOpen}
          onClose={() => !isSubmitting && setIsFormOpen(false)}
          title={editingProject ? "Edit Project" : "Create New Project"}
          description={
            editingProject ? "Update the details of your project." : "Create a new project to organize your tasks."
          }
          className="max-w-2xl"
        >
          {formError && (
            <div className="mb-4 p-2 rounded-md bg-destructive/15 text-destructive text-sm">{formError}</div>
          )}
          <ProjectForm
            initialData={editingProject}
            onSubmit={handleFormSubmit}
            onCancel={() => !isSubmitting && setIsFormOpen(false)}
            isEditing={!!editingProject}
          />
        </Dialog>
      </div>
    </AppLayout>
  );
}
