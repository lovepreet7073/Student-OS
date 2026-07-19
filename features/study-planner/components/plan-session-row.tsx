"use client";

import { useTransition } from "react";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { completeItem } from "../actions/complete-item";
import { formatDuration } from "../lib/dates";
import type { StudyPlanItem } from "../types";

interface PlanSessionRowProps {
  item: StudyPlanItem;
  showToggle?: boolean;
}

export function PlanSessionRow({ item, showToggle = true }: PlanSessionRowProps) {
  const [pending, startTransition] = useTransition();
  const done = Boolean(item.completedAt);

  const handleToggle = () => {
    if (!showToggle) return;
    startTransition(async () => {
      const result = await completeItem({ itemId: item.id, done: !done });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card p-3.5 transition-opacity",
        pending && "opacity-60",
      )}
    >
      {showToggle ? (
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          aria-pressed={done}
          aria-label={done ? "Mark not done" : "Mark done"}
          className={cn(
            "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            done
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border hover:border-primary/60",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
        </button>
      ) : (
        <span
          aria-hidden
          className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {item.subjectName}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground/80">
            {formatDuration(item.durationMinutes)}
          </span>
        </div>
        <div
          className={cn(
            "text-[15px] font-bold leading-tight tracking-tight",
            done && "text-muted-foreground line-through",
          )}
        >
          {item.topic}
        </div>
        {item.notes ? (
          <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground/90">
            {item.notes}
          </p>
        ) : null}
      </div>
    </li>
  );
}
