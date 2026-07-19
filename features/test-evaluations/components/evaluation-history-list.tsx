import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight, Clock } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import { examTypeLabel, toneForPercentage } from "../lib/grading";
import type { TestEvaluationListItem } from "../types";

interface EvaluationHistoryListProps {
  items: TestEvaluationListItem[];
}

export function EvaluationHistoryList({ items }: EvaluationHistoryListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/app/tests/${item.id}`}
            className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <StatusBadge item={item} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {item.subjectName}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground/70">
                  {examTypeLabel(item.examType)} · {formatRelativeTime(item.createdAt)}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[15px] font-bold tracking-tight">
                {item.title}
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {statusLine(item)}
              </div>
            </div>
            <ChevronRight
              className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ item }: { item: TestEvaluationListItem }) {
  if (item.status === "completed") {
    const tone = toneForPercentage(item.aiPercentage);
    return (
      <span
        aria-hidden
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[13px] font-extrabold",
          tone === "success" && "bg-success/12 text-success",
          tone === "warning" && "bg-warning/12 text-warning",
          tone === "danger" && "bg-danger/12 text-danger",
          tone === "muted" && "bg-secondary text-muted-foreground",
        )}
      >
        {item.aiGrade ?? "—"}
      </span>
    );
  }
  if (item.status === "failed") {
    return (
      <span
        aria-hidden
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-danger/12 text-danger"
      >
        <AlertCircle className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
    );
  }
  if (item.status === "evaluating") {
    return (
      <span
        aria-hidden
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary"
      >
        <Clock className="h-[18px] w-[18px] animate-pulse" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"
    >
      <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2} />
    </span>
  );
}

function statusLine(item: TestEvaluationListItem): string {
  switch (item.status) {
    case "completed":
      return `${item.aiScore ?? 0} / ${item.maxMarks} · ${(item.aiPercentage ?? 0).toFixed(1)}%`;
    case "evaluating":
      return "AI is grading…";
    case "pending":
      return "Waiting to start";
    case "failed":
      return "Evaluation failed";
  }
}
