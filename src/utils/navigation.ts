"use client";

import { useRouter, usePathname } from "next/navigation";

/**
 * Navigation paths for the application
 */
export const ROUTES = {
  HOME: "/",
  TODOS: "/todos",
  PROJECTS: "/projects",
  NOTES: "/notes",
  SETTINGS: "/settings",
  CALENDAR: "/calendar",
  ANALYTICS: "/analytics",
  ARCHIVE: "/archive",
};

/**
 * Navigation hook for consistent navigation throughout the app
 */
export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (path: string) => {
    router.push(path);
  };

  const navigateToHome = () => navigate(ROUTES.HOME);
  const navigateToTodos = () => navigate(ROUTES.TODOS);
  const navigateToProjects = () => navigate(ROUTES.PROJECTS);
  const navigateToNotes = () => navigate(ROUTES.NOTES);
  const navigateToSettings = () => navigate(ROUTES.SETTINGS);
  const navigateToCalendar = () => navigate(ROUTES.CALENDAR);
  const navigateToAnalytics = () => navigate(ROUTES.ANALYTICS);
  const navigateToArchive = () => navigate(ROUTES.ARCHIVE);

  const isActive = (path: string) => pathname === path;

  // Create a back navigation function
  const goBack = () => {
    router.back();
  };

  return {
    navigate,
    navigateToHome,
    navigateToTodos,
    navigateToProjects,
    navigateToNotes,
    navigateToSettings,
    navigateToCalendar,
    navigateToAnalytics,
    navigateToArchive,
    goBack,
    isActive,
    currentPath: pathname,
  };
}

/**
 * Get route by view ID (used by sidebar)
 */
export function getRouteByViewId(viewId: string): string {
  switch (viewId) {
    case "dashboard":
      return ROUTES.HOME;
    case "todos":
      return ROUTES.TODOS;
    case "projects":
      return ROUTES.PROJECTS;
    case "notes":
      return ROUTES.NOTES;
    case "calendar":
      return ROUTES.CALENDAR;
    case "analytics":
      return ROUTES.ANALYTICS;
    case "archive":
      return ROUTES.ARCHIVE;
    case "settings":
      return ROUTES.SETTINGS;
    default:
      return ROUTES.HOME;
  }
}
