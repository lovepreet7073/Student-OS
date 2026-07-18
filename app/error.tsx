"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
          Something went wrong
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">We hit an unexpected error</h1>
        <p className="text-muted-foreground">
          Try again in a moment. If the problem persists, our team has been notified.
        </p>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}
