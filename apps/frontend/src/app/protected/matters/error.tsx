"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MattersError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error("Matters error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-destructive/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive h-8 w-8" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We encountered an error while loading your matters.
          {error.digest && (
            <span className="text-muted-foreground/70 mt-1 block text-xs">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
