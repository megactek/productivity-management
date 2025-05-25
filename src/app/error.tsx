"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, ArrowLeft, Home } from "lucide-react";
import { useAppNavigation } from "@/utils/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { navigateToHome, goBack } = useAppNavigation();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Error</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground">Sorry, an unexpected error has occurred. Our team has been notified.</p>
          {error.message && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error.message}</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={goBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => reset()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={navigateToHome} variant="secondary" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
