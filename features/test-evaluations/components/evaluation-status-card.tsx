"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { submitForEvaluation } from "../actions/submit-for-evaluation";
import type { EvaluationStatus } from "../types";

interface EvaluationStatusCardProps {
  evaluationId: string;
  status: EvaluationStatus;
  errorMessage: string | null;
}

/**
 * Shown when the evaluation is not yet 'completed'. Polls the router for
 * the RSC-cached status every 3 seconds while 'evaluating', so the user
 * doesn't have to refresh.
 */
export function EvaluationStatusCard({
  evaluationId,
  status,
  errorMessage,
}: EvaluationStatusCardProps) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  useEffect(() => {
    if (status !== "evaluating") return;
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [status, router]);

  const handleRetry = () => {
    startRetry(async () => {
      const result = await submitForEvaluation({ evaluationId });
      if (!result.ok) toast.error(result.error.message);
      router.refresh();
    });
  };

  if (status === "evaluating") {
    return (
      <section
        className="flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-accent p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <div>
          <div className="text-[15px] font-bold text-accent-foreground">
            AI is grading your test…
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            Usually 30–60 seconds. This page updates automatically.
          </div>
        </div>
      </section>
    );
  }

  if (status === "pending") {
    return (
      <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
        <div className="text-[15px] font-bold">Pending</div>
        <p className="text-[13px] text-muted-foreground">
          Your test is queued but hasn&rsquo;t been sent to the AI yet.
        </p>
        <Button onClick={handleRetry} disabled={retrying}>
          {retrying ? "Sending…" : "Start evaluation"}
        </Button>
      </section>
    );
  }

  // failed
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
      <div>
        <div className="text-[15px] font-bold text-foreground">Evaluation failed</div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {errorMessage || "The AI couldn't finish. Try again."}
        </p>
      </div>
      <Button onClick={handleRetry} disabled={retrying}>
        {retrying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Retrying…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Retry
          </>
        )}
      </Button>
    </section>
  );
}
