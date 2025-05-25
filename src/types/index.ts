export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  images?: TodoImage[];
  tags?: string[];
  subtasks?: SubTask[];
  progress?: number;
  startDate?: string;
  completedAt?: string;
  category?: string;
  dependsOn?: string[]; // IDs of todos this task depends on
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TodoImage {
  id: string;
  url: string;
  thumbnail?: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "planning" | "active" | "on-hold" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  color?: string;
  progress: number;
  todoIds: string[];
  milestones: Milestone[];
  resources?: ProjectResource[];
  tags?: string[];
  owner?: string;
  risks?: ProjectRisk[];
  velocity?: number; // Average tasks completed per week
  timeSpent?: number; // Time spent in minutes
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  todoIds: string[]; // IDs of todos associated with this milestone
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResource {
  id: string;
  name: string;
  type: "file" | "link" | "note";
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRisk {
  id: string;
  title: string;
  description?: string;
  impact: "low" | "medium" | "high";
  probability: "low" | "medium" | "high";
  status: "identified" | "mitigated" | "occurred" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown content
  createdAt: string;
  updatedAt: string;
  images?: NoteImage[];
  projectId?: string;
  todoId?: string;
  tags?: string[];
  folder?: string;
  isFavorite?: boolean;
  lastEditedAt: string;
  contentType: "markdown" | "richtext";
  relatedNotes?: string[]; // IDs of related notes
  relatedTodos?: string[]; // IDs of related todos beyond the primary todoId
  version?: number; // For version history
  collaborators?: string[]; // For future collaboration features
  color?: string; // For note color coding
}

export interface NoteImage {
  id: string;
  url: string;
  thumbnail?: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface NoteTag {
  id: string;
  name: string;
  color: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string; // For nested folders
}

export interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  timestamp: string;
  author?: string;
}

export interface AppData {
  todos: Todo[];
  projects: Project[];
  notes: Note[];
  settings: AppSettings;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  completionGoal: number;
  workingHours: {
    start: string;
    end: string;
  };
  useServerStorage?: boolean;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: string;
  read: boolean;
  todoId?: string;
  projectId?: string;
  noteId?: string;
  priority: "low" | "medium" | "high";
  actions?: NotificationAction[];
  expiresAt?: string; // When the notification should be removed
  category?: "todo" | "project" | "note" | "system";
  source?: "dueDate" | "progress" | "mention" | "system" | "reminder";
}

export interface NotificationAction {
  id: string;
  label: string;
  action: "view" | "complete" | "dismiss" | "snooze" | "custom";
  url?: string; // For navigation
  payload?: Record<string, unknown>; // For custom actions
}

export interface NotificationPreference {
  enabled: boolean;
  channels: Array<"browser" | "email" | "system">;
  quietHoursStart?: string; // Time in 24hr format
  quietHoursEnd?: string; // Time in 24hr format
  categories: {
    todo: boolean;
    project: boolean;
    note: boolean;
    system: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
  };
}
