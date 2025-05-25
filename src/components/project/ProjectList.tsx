"use client";

import { Project } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { MoreHorizontal, Edit, Trash2, CheckCircle, Archive, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onStatusChange: (id: string, status: Project["status"]) => Promise<Project>;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectList({ projects, isLoading, onStatusChange, onEdit, onDelete }: ProjectListProps) {
  // Group projects by status
  const activeProjects = projects.filter((project) => project.status === "active");
  const completedProjects = projects.filter((project) => project.status === "completed");
  const archivedProjects = projects.filter((project) => project.status === "archived");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-background">
        <h3 className="text-lg font-medium">No projects yet</h3>
        <p className="text-muted-foreground">Create your first project to organize your tasks.</p>
      </div>
    );
  }

  const renderProjectSection = (sectionProjects: Project[], title: string) => {
    if (sectionProjects.length === 0) return null;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderProjectSection(activeProjects, "Active Projects")}
      {renderProjectSection(completedProjects, "Completed Projects")}
      {renderProjectSection(archivedProjects, "Archived Projects")}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onStatusChange: (id: string, status: Project["status"]) => Promise<Project>;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => Promise<void>;
}

function ProjectCard({ project, onStatusChange, onEdit, onDelete }: ProjectCardProps) {
  const { id, name, description, status, progress, dueDate, color = "#3b82f6" } = project;

  // Format due date
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;

  const handleStatusChange = async (newStatus: Project["status"]) => {
    try {
      await onStatusChange(id, newStatus);
    } catch (error) {
      console.error("Failed to change project status:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              {status !== "completed" && (
                <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Completed
                </DropdownMenuItem>
              )}

              {status !== "active" && (
                <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Mark Active
                </DropdownMenuItem>
              )}

              {status !== "archived" && (
                <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}

        <div className="mt-4 flex-1 flex flex-col justify-end">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {formattedDueDate && (
            <div className="mt-3 text-xs flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Due {formattedDueDate}
            </div>
          )}

          <div className="mt-2 text-xs">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                status === "active"
                  ? "bg-blue-100 text-blue-800"
                  : status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
