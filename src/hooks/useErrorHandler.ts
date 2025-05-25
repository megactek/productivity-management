"use client";
import { useState, useCallback } from "react";

export function useErrorHandler() {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = useCallback((message: string) => {
    setErrorState(message);

    // Optionally log to a monitoring service or analytics
    console.error(`Error occurred: ${message}`);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  return {
    error,
    setError,
    clearError,
    hasError: !!error,
  };
}
