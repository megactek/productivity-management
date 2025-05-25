"use client";

import { useState } from "react";
import {
  Home,
  CheckSquare,
  FolderOpen,
  StickyNote,
  Archive,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAppNavigation, getRouteByViewId } from "@/utils/navigation";

interface SidebarProps {
  todoCount: number;
  projectCount: number;
  noteCount: number;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, color: "text-blue-500" },
  { id: "todos", label: "Todos", icon: CheckSquare, color: "text-green-500" },
  { id: "projects", label: "Projects", icon: FolderOpen, color: "text-purple-500" },
  { id: "notes", label: "Notes", icon: StickyNote, color: "text-yellow-500" },
  { id: "calendar", label: "Calendar", icon: Calendar, color: "text-red-500" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-indigo-500" },
  { id: "archive", label: "Archive", icon: Archive, color: "text-gray-500" },
];

export function Sidebar({ todoCount, projectCount, noteCount }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { navigate, currentPath } = useAppNavigation();

  const getCounts = (itemId: string) => {
    switch (itemId) {
      case "todos":
        return todoCount;
      case "projects":
        return projectCount;
      case "notes":
        return noteCount;
      default:
        return 0;
    }
  };

  // Get active view ID from current path
  const getActiveViewFromPath = () => {
    if (currentPath === "/") return "dashboard";
    // Extract the first part of the path (e.g., /todos/123 -> todos)
    const pathSegments = currentPath.split("/").filter(Boolean);
    return pathSegments.length > 0 ? pathSegments[0] : "dashboard";
  };

  const activeView = getActiveViewFromPath();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 pt-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const count = getCounts(item.id);
          const isActive = activeView === item.id;
          const route = getRouteByViewId(item.id);

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start space-x-3 px-3 py-2 h-10 transition-all duration-200",
                isActive && "bg-secondary shadow-sm",
                isCollapsed && "px-2"
              )}
              onClick={() => navigate(route)}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {count > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {count}
                    </span>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
