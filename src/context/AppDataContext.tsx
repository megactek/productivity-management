"use client";
import { createContext, useContext, ReactNode } from "react";
import { useAppData } from "@/hooks";
import { AppSettings, Note, Project, Todo, NoteImage } from "@/types";

// Define the context type
interface AppDataContextType {
  // Todo state
  todos: Todo[];
  pendingTodos: Todo[];
  completedTodos: Todo[];
  overdueTodos: Todo[];
  addTodo: (
    title: string,
    description?: string,
    dueDate?: string,
    priority?: "low" | "medium" | "high",
    projectId?: string
  ) => Promise<Todo>;
  updateTodo: (updatedTodo: Todo) => Promise<Todo>;
  updateTodoStatus: (id: string, status: Todo["status"]) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  getTodosByProject: (projectId: string) => Promise<Todo[]>;

  // Project state
  projects: Project[];
  activeProjects: Project[];
  completedProjects: Project[];
  archivedProjects: Project[];
  createProject: (projectData: Omit<Project, "id" | "createdAt" | "todoIds">) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) => Promise<Project>;
  updateProjectStatus: (id: string, status: Project["status"]) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addTodoToProject: (projectId: string, todoId: string) => Promise<Project>;
  removeTodoFromProject: (projectId: string, todoId: string) => Promise<Project>;

  // Notes state
  notes: Note[];
  createNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "lastEditedAt" | "version">) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  getNotesByProject: (projectId: string) => Promise<Note[]>;
  getNotesByTodo: (todoId: string) => Promise<Note[]>;
  addImageToNote: (noteId: string, file: File) => Promise<NoteImage>;
  removeImageFromNote: (noteId: string, imageId: string) => Promise<Note>;
  toggleFavorite: (noteId: string) => Promise<Note>;

  // Settings
  settings: AppSettings | null;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  updateTheme: (theme: "light" | "dark" | "system") => Promise<AppSettings>;
  updateNotifications: (enabled: boolean) => Promise<AppSettings>;

  // App state
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
}

// Create the context with an empty default value
const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Create the provider component
export function AppDataProvider({ children }: { children: ReactNode }) {
  const appData = useAppData();

  return <AppDataContext.Provider value={appData}>{children}</AppDataContext.Provider>;
}

// Create a hook to use the context
export function useAppDataContext() {
  const context = useContext(AppDataContext);

  if (context === undefined) {
    throw new Error("useAppDataContext must be used within an AppDataProvider");
  }

  return context;
}
