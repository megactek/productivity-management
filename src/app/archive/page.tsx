"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppDataContext } from "@/context/AppDataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { format, parseISO } from "date-fns";
import { Search, Filter, ArchiveRestore, Trash2 } from "lucide-react";

export default function ArchivePage() {
  const { todos, projects, updateTodoStatus, deleteTodo, updateProjectStatus, deleteProject } = useAppDataContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  // Get completed todos
  const completedTodos = todos.filter((todo) => todo.status === "completed");

  // Get archived projects
  const archivedProjects = projects.filter((project) => project.status === "archived");

  // Filter and sort completed todos
  const filteredTodos = completedTodos
    .filter((todo) => {
      const matchesSearch =
        searchQuery === "" ||
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProject = projectFilter === "" || todo.projectId === projectFilter;

      return matchesSearch && matchesProject;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  // Filter and sort archived projects
  const filteredProjects = archivedProjects
    .filter((project) => {
      return (
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  // Handle restore todo
  const handleRestoreTodo = async (id: string) => {
    try {
      await updateTodoStatus(id, "pending");
    } catch (error) {
      console.error("Failed to restore todo:", error);
    }
  };

  // Handle delete todo
  const handleDeleteTodo = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      try {
        await deleteTodo(id);
      } catch (error) {
        console.error("Failed to delete todo:", error);
      }
    }
  };

  // Handle restore project
  const handleRestoreProject = async (id: string) => {
    try {
      await updateProjectStatus(id, "active");
    } catch (error) {
      console.error("Failed to restore project:", error);
    }
  };

  // Handle delete project
  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this project?")) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-muted-foreground">View and manage your completed tasks and archived projects.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="todos">Completed Tasks</TabsTrigger>
            <TabsTrigger value="projects">Archived Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-4 space-y-4">
            {/* Project filter for todos */}
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {filteredTodos.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium">No completed tasks found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || projectFilter ? "Try adjusting your filters" : "Complete some tasks to see them here"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTodos.map((todo) => {
                  const project = projects.find((p) => p.id === todo.projectId);

                  return (
                    <div key={todo.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-through text-muted-foreground">{todo.title}</h3>
                          {todo.priority && (
                            <Badge
                              variant={
                                todo.priority === "high"
                                  ? "destructive"
                                  : todo.priority === "medium"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {todo.priority}
                            </Badge>
                          )}
                        </div>

                        {todo.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">{todo.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {project && (
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color || "#3b82f6" }}
                              />
                              {project.name}
                            </span>
                          )}

                          {todo.completedAt && (
                            <span>Completed {format(parseISO(todo.completedAt), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreTodo(todo.id)}
                          title="Restore task"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Restore</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete permanently"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium">No archived projects found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search" : "Archive projects to see them here"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || "#3b82f6" }}
                        />
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                      )}

                      <div className="text-xs text-muted-foreground mb-4">
                        <div>Archived on {format(parseISO(project.updatedAt), "MMM d, yyyy")}</div>
                        {project.todoIds.length > 0 && (
                          <div className="mt-1">Contains {project.todoIds.length} tasks</div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleRestoreProject(project.id)}>
                          <ArchiveRestore className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
