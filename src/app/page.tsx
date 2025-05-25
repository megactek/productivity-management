"use client";

import { useAppDataContext } from "@/context/AppDataContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { Clock, AlertTriangle, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/Progress";

export default function Home() {
  const { todos, projects, notes } = useAppDataContext();

  // Calculate statistics
  const activeTodos = todos.filter((todo) => todo.status === "pending");
  const completedTodos = todos.filter((todo) => todo.status === "completed");
  const overdueTodos = todos.filter(
    (todo) => todo.status === "pending" && todo.dueDate && isBefore(parseISO(todo.dueDate), new Date())
  );

  const activeProjects = projects.filter((project) => project.status === "active");
  const completedProjects = projects.filter((project) => project.status === "completed");

  // Get upcoming tasks (due in next 7 days)
  const upcomingTodos = todos
    .filter(
      (todo) =>
        todo.status === "pending" &&
        todo.dueDate &&
        isAfter(parseISO(todo.dueDate), new Date()) &&
        isBefore(parseISO(todo.dueDate), addDays(new Date(), 7))
    )
    .sort((a, b) => parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime());

  // Get projects with highest progress
  const sortedProjects = [...activeProjects].sort((a, b) => b.progress - a.progress);

  // Calculate completion rate
  const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to TaskFlow, your lightweight task management system.</p>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTodos.length}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Active tasks</p>
                <span className="text-xs text-green-500">{completedTodos.length} completed</span>
              </div>
              <Progress className="h-1 mt-2" value={completionRate} />
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" size="sm">
                <Link href="/todos">View Tasks</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Active projects</p>
                <span className="text-xs text-green-500">{completedProjects.length} completed</span>
              </div>
              <Progress
                className="h-1 mt-2"
                value={
                  activeProjects.length > 0
                    ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
                    : 0
                }
              />
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/projects">View Projects</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notes.length}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Saved notes</p>
                {notes.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Last updated: {format(parseISO(notes[0].updatedAt || notes[0].createdAt), "MMM d")}
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/notes">View Notes</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className={overdueTodos.length > 0 ? "border-red-200 dark:border-red-900" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{overdueTodos.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Tasks requiring attention</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="destructive" className="w-full" size="sm">
                <Link href="/todos">View Overdue</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>Tasks due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTodos.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No upcoming tasks due soon</div>
              ) : (
                <div className="space-y-3">
                  {upcomingTodos.slice(0, 5).map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{todo.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {todo.dueDate && format(parseISO(todo.dueDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          isBefore(parseISO(todo.dueDate!), addDays(new Date(), 2))
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {isBefore(parseISO(todo.dueDate!), addDays(new Date(), 2)) ? "Urgent" : "Upcoming"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {upcomingTodos.length > 0 && (
              <CardFooter>
                <Button asChild variant="ghost" className="w-full" size="sm">
                  <Link href="/todos">View All Tasks</Link>
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                Project Progress
              </CardTitle>
              <CardDescription>Status of your active projects</CardDescription>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No active projects</div>
              ) : (
                <div className="space-y-4">
                  {sortedProjects.slice(0, 4).map((project) => (
                    <div key={project.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {activeProjects.length > 0 && (
              <CardFooter>
                <Button asChild variant="ghost" className="w-full" size="sm">
                  <Link href="/projects">View All Projects</Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
