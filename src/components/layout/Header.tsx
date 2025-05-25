"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus, Settings, CheckSquare, FolderOpen, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./NotificationCenter";
import { useAppNavigation } from "@/utils/navigation";
import { useAppDataContext } from "@/context/AppDataContext";

interface HeaderProps {
  onAddClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ onAddClick, searchQuery, onSearchChange }: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { navigateToHome, navigateToSettings, navigateToTodos, navigateToProjects, navigateToNotes } =
    useAppNavigation();
  const { todos, projects, notes } = useAppDataContext();
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter items based on search query
  const searchResults = {
    todos: todos
      .filter(
        (todo) =>
          todo?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (todo?.description && todo?.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 5),
    projects: projects
      .filter(
        (project) =>
          project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project?.description && project?.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 3),
    notes: notes
      .filter(
        (note) =>
          note?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (note?.content && note?.content?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 3),
  };

  const hasResults =
    searchQuery &&
    (searchResults.todos.length > 0 || searchResults.projects.length > 0 || searchResults.notes.length > 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={navigateToHome}
          role="button"
          tabIndex={0}
          aria-label="Go to home page"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigateToHome();
            }
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">📋</span>
          </div>
          <h1 className="text-xl font-bold">TaskFlow</h1>
        </div>

        {/* Search Bar */}
        <div className="flex flex-1 items-center space-x-2 md:justify-end" ref={searchRef}>
          <div className={cn("relative w-full max-w-sm", isSearchFocused && "md:max-w-md")}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search todos, projects, notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="pl-8 transition-all duration-200"
            />

            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[70vh] overflow-y-auto">
                {!hasResults && (
                  <div className="p-4 text-center text-muted-foreground">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                )}

                {searchResults.todos.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">Tasks</h3>
                    <div className="space-y-1">
                      {searchResults.todos.map((todo) => (
                        <button
                          key={todo.id}
                          className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-left"
                          onClick={() => {
                            navigateToTodos();
                            setIsSearchFocused(false);
                            onSearchChange("");
                          }}
                        >
                          <CheckSquare className="h-4 w-4 text-primary" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{todo.title}</p>
                            {todo.description && (
                              <p className="text-xs text-muted-foreground truncate">{todo.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.projects.length > 0 && (
                  <div className="p-2 border-t">
                    <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">Projects</h3>
                    <div className="space-y-1">
                      {searchResults.projects.map((project) => (
                        <button
                          key={project.id}
                          className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-left"
                          onClick={() => {
                            navigateToProjects();
                            setIsSearchFocused(false);
                            onSearchChange("");
                          }}
                        >
                          <FolderOpen className="h-4 w-4 text-primary" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.notes.length > 0 && (
                  <div className="p-2 border-t">
                    <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">Notes</h3>
                    <div className="space-y-1">
                      {searchResults.notes.map((note) => (
                        <button
                          key={note.id}
                          className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md text-left"
                          onClick={() => {
                            navigateToNotes();
                            setIsSearchFocused(false);
                            onSearchChange("");
                          }}
                        >
                          <StickyNote className="h-4 w-4 text-primary" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{note.title}</p>
                            {note.content && (
                              <p className="text-xs text-muted-foreground truncate">{note.content.substring(0, 50)}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasResults && (
                  <div className="p-2 border-t text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setIsSearchFocused(false);
                        onSearchChange("");
                      }}
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* NotificationCenter is now embedded in the header */}
          <NotificationCenter />

          <Button onClick={onAddClick} size="sm" className="space-x-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={navigateToSettings}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
