import fs from "fs";
import path from "path";
import type { AppData, Todo, Project, Note } from "@/types";

const DATA_PATH = path.join(process.cwd(), "src", "data", "appData.json");

// Read data from JSON file
export async function readData(): Promise<AppData> {
  try {
    const rawData = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(rawData) as AppData;
  } catch (error) {
    console.error("Error reading data:", error);
    // Return default data structure if file doesn't exist or is corrupt
    return {
      todos: [],
      projects: [],
      notes: [],
      settings: {
        theme: "system",
        notifications: true,
        completionGoal: 5,
        workingHours: {
          start: "09:00",
          end: "17:00",
        },
      },
    };
  }
}

// Write data to JSON file
export async function writeData(data: AppData): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(DATA_PATH, jsonData, "utf8");
  } catch (error) {
    console.error("Error writing data:", error);
    throw new Error("Failed to save data");
  }
}

// Helper functions for specific data operations
export async function getTodos(): Promise<Todo[]> {
  const data = await readData();
  return data.todos;
}

export async function getProjects(): Promise<Project[]> {
  const data = await readData();
  return data.projects;
}

export async function getNotes(): Promise<Note[]> {
  const data = await readData();
  return data.notes;
}

export async function addTodo(todo: Todo): Promise<Todo> {
  const data = await readData();
  data.todos.push(todo);
  await writeData(data);
  return todo;
}

export async function updateTodo(updatedTodo: Todo): Promise<Todo> {
  const data = await readData();
  const index = data.todos.findIndex((todo) => todo.id === updatedTodo.id);

  if (index === -1) {
    throw new Error(`Todo with id ${updatedTodo.id} not found`);
  }

  data.todos[index] = updatedTodo;
  await writeData(data);
  return updatedTodo;
}

export async function deleteTodo(id: string): Promise<void> {
  const data = await readData();
  data.todos = data.todos.filter((todo) => todo.id !== id);
  await writeData(data);
}
