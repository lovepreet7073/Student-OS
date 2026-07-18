import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import type { QuizListItem } from "../types";

interface QuizHistoryListProps {
  quizzes: QuizListItem[];
}

export function QuizHistoryList({ quizzes }: QuizHistoryListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {quizzes.map((q) => (
        <li key={q.id}>
          <Link
            href={`/app/study/${q.id}`}
            className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <StatusIcon completed={q.completedAt !== null} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {q.subjectName}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground/70">
                  {formatRelativeTime(q.createdAt)}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[15px] font-bold tracking-tight">
                {q.topic}
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {q.completedAt !== null
                  ? `${q.correctCount ?? 0} / ${q.totalQuestions} correct`
                  : `${q.totalQuestions} questions · in progress`}
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

function StatusIcon({ completed }: { completed: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md",
        completed ? "bg-success/12 text-success" : "bg-accent text-primary",
      )}
    >
      {completed ? (
        <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2} />
      ) : (
        <Clock className="h-[18px] w-[18px]" strokeWidth={2} />
      )}
    </span>
  );
}
