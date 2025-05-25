"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppDataContext } from "@/context/AppDataContext";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Todo, Project, Milestone } from "@/types";

export default function CalendarPage() {
  const { todos, projects } = useAppDataContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [filteredItems, setFilteredItems] = useState<{
    todos: Todo[];
    milestones: { milestone: Milestone; project: Project }[];
  }>({
    todos: [],
    milestones: [],
  });

  // Filter todos and milestones with valid dates
  useEffect(() => {
    const filteredTodos = todos.filter((todo) => todo.dueDate && isValid(parseISO(todo.dueDate)));

    const projectMilestones: { milestone: Milestone; project: Project }[] = [];
    projects.forEach((project) => {
      if (project.milestones && project.milestones.length > 0) {
        project.milestones.forEach((milestone) => {
          if (milestone.dueDate && isValid(parseISO(milestone.dueDate))) {
            projectMilestones.push({ milestone, project });
          }
        });
      }
    });

    setFilteredItems({ todos: filteredTodos, milestones: projectMilestones });
  }, [todos, projects]);

  // Generate calendar days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigation functions
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get items for a specific day
  const getItemsForDay = (day: Date) => {
    const dayItems = {
      todos: filteredItems.todos.filter((todo) => {
        const dueDate = parseISO(todo.dueDate!);
        return (
          dueDate.getDate() === day.getDate() &&
          dueDate.getMonth() === day.getMonth() &&
          dueDate.getFullYear() === day.getFullYear()
        );
      }),
      milestones: filteredItems.milestones.filter(({ milestone }) => {
        const dueDate = parseISO(milestone.dueDate!);
        return (
          dueDate.getDate() === day.getDate() &&
          dueDate.getMonth() === day.getMonth() &&
          dueDate.getFullYear() === day.getFullYear()
        );
      }),
    };
    return dayItems;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">View your tasks and project milestones.</p>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={view} onChange={(e) => setView(e.target.value as "month" | "week" | "day")}>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </Select>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-muted">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const dayItems = getItemsForDay(day);
              const hasItems = dayItems.todos.length > 0 || dayItems.milestones.length > 0;

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] p-2 bg-card relative",
                    isToday(day) && "bg-blue-50 dark:bg-blue-900/20",
                    !isSameMonth(day, currentDate) && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-sm",
                      isToday(day) && "bg-primary text-primary-foreground font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Todo items */}
                  <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                    {dayItems.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "text-xs p-1 rounded truncate",
                          todo.priority === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : todo.priority === "medium"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        )}
                      >
                        {todo.title}
                      </div>
                    ))}

                    {/* Milestone items */}
                    {dayItems.milestones.map(({ milestone, project }) => (
                      <div
                        key={milestone.id}
                        className="text-xs p-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded truncate"
                      >
                        🏁 {milestone.title} ({project.name})
                      </div>
                    ))}
                  </div>

                  {/* Indicator for more items */}
                  {hasItems && dayItems.todos.length + dayItems.milestones.length > 3 && (
                    <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                      +{dayItems.todos.length + dayItems.milestones.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
