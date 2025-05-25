"use client";

import React, { Component, ErrorInfo, ReactNode, useState, useCallback } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by error boundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function useErrorBoundary() {
  const [key, setKey] = useState(0);

  const resetBoundary = useCallback(() => {
    setKey((prevKey) => prevKey + 1);
  }, []);

  const ErrorBoundary = useCallback(
    ({ children, fallback }: ErrorBoundaryProps) => (
      <ErrorBoundaryComponent key={key} fallback={fallback}>
        {children}
      </ErrorBoundaryComponent>
    ),
    [key]
  );

  return { ErrorBoundary, resetBoundary };
}
