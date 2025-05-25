"use client";

import { useState } from "react";
import { Project, ProjectResource } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { File, Link as LinkIcon, Newspaper, Plus, ExternalLink, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ProjectResourcesProps {
  project: Project;
  onAddResource: (resourceData: Omit<ProjectResource, "id" | "createdAt" | "updatedAt">) => void;
  onDeleteResource: (resourceId: string) => void;
}

export function ProjectResources({ project, onAddResource, onDeleteResource }: ProjectResourcesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newResource, setNewResource] = useState<{
    name: string;
    type: ProjectResource["type"];
    url: string;
  }>({
    name: "",
    type: "link",
    url: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResource.name.trim() && newResource.url.trim()) {
      onAddResource({
        name: newResource.name.trim(),
        type: newResource.type,
        url: newResource.url.trim(),
      });
      setNewResource({
        name: "",
        type: "link",
        url: "",
      });
      setIsAdding(false);
    }
  };

  // Get resource icon based on type
  const getResourceIcon = (type: ProjectResource["type"]) => {
    switch (type) {
      case "file":
        return <File size={16} className="text-blue-500" />;
      case "link":
        return <LinkIcon size={16} className="text-green-500" />;
      case "note":
        return <Newspaper size={16} className="text-orange-500" />;
      default:
        return <File size={16} />;
    }
  };

  // Group resources by type
  const resourcesByType = (project.resources || []).reduce((groups, resource) => {
    const type = resource.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(resource);
    return groups;
  }, {} as Record<ProjectResource["type"], ProjectResource[]>);

  // Sort resources by name within each type
  Object.keys(resourcesByType).forEach((type) => {
    resourcesByType[type as ProjectResource["type"]].sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Project Resources</h3>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="flex items-center gap-1">
            <Plus size={16} />
            <span>Add Resource</span>
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-4">
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div>
              <label htmlFor="new-resource-name" className="text-sm font-medium block mb-1">
                Resource Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="new-resource-name"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                placeholder="Name this resource"
                required
              />
            </div>
            <div>
              <label htmlFor="new-resource-type" className="text-sm font-medium block mb-1">
                Resource Type
              </label>
              <Select
                id="new-resource-type"
                value={newResource.type}
                onChange={(e) => setNewResource({ ...newResource, type: e.target.value as ProjectResource["type"] })}
              >
                <option value="link">Link</option>
                <option value="file">File</option>
                <option value="note">Note</option>
              </Select>
            </div>
            <div>
              <label htmlFor="new-resource-url" className="text-sm font-medium block mb-1">
                URL {newResource.type === "link" && <span className="text-destructive">*</span>}
              </label>
              <Input
                id="new-resource-url"
                value={newResource.url}
                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                placeholder={
                  newResource.type === "link"
                    ? "https://example.com"
                    : newResource.type === "file"
                    ? "Path or URL to file"
                    : "URL or identifier for the note"
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add Resource
              </Button>
            </div>
          </form>
        </Card>
      )}

      {(!project.resources || project.resources.length === 0) && !isAdding && (
        <p className="text-sm text-muted-foreground">
          No resources added yet. Add files, links, or notes to organize project materials.
        </p>
      )}

      <div className="space-y-4">
        {Object.entries(resourcesByType).map(([type, resources]) => (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-medium">
              {type.charAt(0).toUpperCase() + type.slice(1)}s ({resources.length})
            </h4>
            <div className="space-y-2">
              {resources.map((resource) => (
                <Card key={resource.id} className="p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.type)}
                      <div>
                        <h5 className="font-medium text-sm">{resource.name}</h5>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>Added: {formatDate(resource.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(resource.url, "_blank")}
                        className="h-7 w-7"
                        title="Open resource"
                      >
                        <ExternalLink size={15} className="text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteResource(resource.id)}
                        className="h-7 w-7"
                        title="Delete resource"
                      >
                        <Trash size={15} className="text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
