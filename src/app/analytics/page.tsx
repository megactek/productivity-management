"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppDataContext } from "@/context/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { format, subDays, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { CheckCircle, Clock, AlertTriangle, BarChart3, PieChart, LineChart, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { todos, projects } = useAppDataContext();
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "90days">("7days");

  // Calculate date range based on selected time range
  const dateRange = useMemo(() => {
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "30days":
        startDate = subDays(endDate, 30);
        break;
      case "90days":
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 7);
    }

    return { start: startDate, end: endDate };
  }, [timeRange]);

  // Filter items within the selected date range
  const filteredData = useMemo(() => {
    const filteredTodos = todos.filter((todo) => {
      if (!todo.createdAt) return false;
      const createdDate = parseISO(todo.createdAt);
      return isWithinInterval(createdDate, dateRange);
    });

    const completedTodos = filteredTodos.filter((todo) => todo.status === "completed");
    const overdueTodos = filteredTodos.filter((todo) => {
      if (!todo.dueDate || todo.status === "completed") return false;
      const dueDate = parseISO(todo.dueDate);
      return dueDate < new Date();
    });

    return {
      todos: filteredTodos,
      completedTodos,
      overdueTodos,
      completionRate: filteredTodos.length > 0 ? (completedTodos.length / filteredTodos.length) * 100 : 0,
      overdueRate: filteredTodos.length > 0 ? (overdueTodos.length / filteredTodos.length) * 100 : 0,
    };
  }, [todos, dateRange]);

  // Calculate productivity score (0-100)
  const productivityScore = useMemo(() => {
    // Base score from completion rate
    let score = filteredData.completionRate;

    // Deduct points for overdue tasks
    score = Math.max(0, score - filteredData.overdueRate / 2);

    // Add points for consistent task completion (simplified)
    if (filteredData.completedTodos.length >= 5) score += 10;
    if (filteredData.completedTodos.length >= 15) score += 10;

    // Cap at 100
    return Math.min(100, Math.round(score));
  }, [filteredData]);

  // Generate daily completion data for chart
  const dailyCompletionData = useMemo(() => {
    const days = differenceInDays(dateRange.end, dateRange.start) + 1;
    const data = Array(days).fill(0);

    filteredData.completedTodos.forEach((todo) => {
      if (!todo.completedAt) return;
      const completedDate = parseISO(todo.completedAt);
      const dayIndex = differenceInDays(completedDate, dateRange.start);
      if (dayIndex >= 0 && dayIndex < days) {
        data[dayIndex]++;
      }
    });

    return data;
  }, [filteredData.completedTodos, dateRange]);

  // Calculate project progress statistics
  const projectStats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "active");
    const completedProjects = projects.filter((p) => p.status === "completed");

    const avgProgress =
      activeProjects.length > 0
        ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length)
        : 0;

    return {
      total: projects.length,
      active: activeProjects.length,
      completed: completedProjects.length,
      avgProgress,
    };
  }, [projects]);

  // Calculate priority distribution
  const priorityDistribution = useMemo(() => {
    const high = todos.filter((t) => t.priority === "high").length;
    const medium = todos.filter((t) => t.priority === "medium").length;
    const low = todos.filter((t) => t.priority === "low").length;

    return { high, medium, low };
  }, [todos]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Track your productivity and project progress.</p>
          </div>

          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as "7days" | "30days" | "90days")}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </Select>
        </div>

        {/* Productivity Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Productivity Score</CardTitle>
              <CardDescription>Your overall productivity based on task completion and timeliness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-muted opacity-20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={`${productivityScore * 2.83} 283`}
                      strokeLinecap="round"
                      className={`${
                        productivityScore > 75
                          ? "text-green-500"
                          : productivityScore > 50
                          ? "text-amber-500"
                          : "text-red-500"
                      } transform -rotate-90 origin-center`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{productivityScore}</span>
                    <span className="text-xs text-muted-foreground">out of 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full mt-4">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold">{filteredData.todos.length}</div>
                    <div className="text-xs text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-green-500">{filteredData.completedTodos.length}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-red-500">{filteredData.overdueTodos.length}</div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
            <TabsTrigger value="projects">Project Analytics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Task Completion Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(filteredData.completionRate)}%</div>
                  <Progress value={filteredData.completionRate} className="h-2 mt-2" />
                </CardContent>
              </Card>

              {/* Overdue Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Overdue Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(filteredData.overdueRate)}%</div>
                  <Progress value={filteredData.overdueRate} className="h-2 mt-2" />
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-blue-500" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">High</span>
                      <span className="font-bold">{priorityDistribution.high}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Medium</span>
                      <span className="font-bold">{priorityDistribution.medium}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Low</span>
                      <span className="font-bold">{priorityDistribution.low}</span>
                    </div>
                  </div>

                  <div className="flex w-full h-2 mt-3 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${
                          (priorityDistribution.high /
                            (priorityDistribution.high + priorityDistribution.medium + priorityDistribution.low)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${
                          (priorityDistribution.medium /
                            (priorityDistribution.high + priorityDistribution.medium + priorityDistribution.low)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${
                          (priorityDistribution.low /
                            (priorityDistribution.high + priorityDistribution.medium + priorityDistribution.low)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Daily Completion Chart */}
              <Card className="col-span-1 md:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-indigo-500" />
                    Daily Task Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 flex items-end justify-between gap-1">
                    {dailyCompletionData.map((count, i) => {
                      const maxCount = Math.max(...dailyCompletionData, 1);
                      const height = count > 0 ? Math.max((count / maxCount) * 100, 10) : 0;

                      return (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-full bg-primary/80 rounded-t ${height > 0 ? "" : "h-0"}`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs mt-1">
                            {format(subDays(dateRange.end, dailyCompletionData.length - 1 - i), "d")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-2xl font-bold">{projectStats.total}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <span className="text-2xl font-bold text-blue-500">{projectStats.active}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Completed</span>
                      <span className="text-2xl font-bold text-green-500">{projectStats.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    Average Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats.avgProgress}%</div>
                  <Progress value={projectStats.avgProgress} className="h-2 mt-2" />
                </CardContent>
              </Card>

              {/* Project Health */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Project Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {projects
                      .filter((p) => p.status === "active")
                      .slice(0, 3)
                      .map((project) => (
                        <div key={project.id} className="flex items-center justify-between">
                          <div className="truncate flex-1 mr-2">
                            <div className="text-sm font-medium truncate">{project.name}</div>
                            <Progress value={project.progress} className="h-1 mt-1" />
                          </div>
                          <div className="text-sm font-medium">{project.progress}%</div>
                        </div>
                      ))}

                    {projects.filter((p) => p.status === "active").length > 3 && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{projects.filter((p) => p.status === "active").length - 3} more projects
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Productivity Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <LineChart className="h-4 w-4 mr-2 text-blue-500" />
                    Productivity Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-40 text-center">
                    <div className="text-muted-foreground text-sm">
                      More data needed to generate productivity trends
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completion Time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                    Average Completion Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-40 text-center">
                    <div className="text-muted-foreground text-sm">
                      More data needed to calculate average completion time
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
