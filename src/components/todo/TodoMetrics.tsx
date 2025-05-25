"use client";

import { useMemo } from "react";
import { Todo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { CheckCircle, Clock, AlertTriangle, BarChart } from "lucide-react";

interface TodoMetricsProps {
  todos: Todo[];
}

export function TodoMetrics({ todos }: TodoMetricsProps) {
  const metrics = useMemo(() => {
    // Count by status
    const pendingCount = todos.filter((t) => t.status === "pending").length;
    const inProgressCount = todos.filter((t) => t.status === "in-progress").length;
    const completedCount = todos.filter((t) => t.status === "completed").length;

    // Overdue todos
    const now = new Date();
    const overdueCount = todos.filter((t) => {
      if (t.status === "completed" || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Completion rate
    const completionRate = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

    // Priority distribution
    const highPriorityCount = todos.filter((t) => t.priority === "high").length;
    const mediumPriorityCount = todos.filter((t) => t.priority === "medium").length;
    const lowPriorityCount = todos.filter((t) => t.priority === "low").length;

    // Today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = todos.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    const dueToday = todos.filter((t) => {
      if (t.status === "completed" || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }).length;

    return {
      total: todos.length,
      pending: pendingCount,
      inProgress: inProgressCount,
      completed: completedCount,
      overdue: overdueCount,
      completionRate,
      highPriority: highPriorityCount,
      mediumPriority: mediumPriorityCount,
      lowPriority: lowPriorityCount,
      completedToday,
      dueToday,
    };
  }, [todos]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Progress & Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <Progress value={metrics.completionRate} className="h-2 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.completed} of {metrics.total} tasks completed
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart className="h-4 w-4 text-blue-500" />
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Pending</span>
              <span className="font-medium">{metrics.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>In Progress</span>
              <span className="font-medium">{metrics.inProgress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Completed</span>
              <span className="font-medium">{metrics.completed}</span>
            </div>
          </CardContent>
        </Card>

        {/* Due Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dueToday}</div>
            <div className="text-xs text-muted-foreground mt-1">{metrics.completedToday} completed today</div>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overdue}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.overdue > 0 ? "Needs attention" : "All caught up!"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
