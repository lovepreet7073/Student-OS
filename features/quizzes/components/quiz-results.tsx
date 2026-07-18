"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import { deleteQuiz } from "../actions/delete-quiz";
import type { QuizWithQuestions } from "../types";
import { QuestionResultsCard } from "./question-results-card";

interface QuizResultsProps {
  quiz: QuizWithQuestions;
}

export function QuizResults({ quiz }: QuizResultsProps) {
  const [deleting, startDeleteTransition] = useTransition();
  const correct = quiz.correctCount ?? 0;
  const pct = Math.round((correct / quiz.totalQuestions) * 100);
  const tone: "success" | "warning" | "danger" =
    pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger";

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteQuiz({ id: quiz.id }, { redirectTo: "/app/study" });
      if (result && !result.ok) toast.error(result.error.message);
    });
  };

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to Study" className="mb-5 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/study">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {quiz.subjectName} · {formatRelativeTime(quiz.completedAt ?? quiz.createdAt)}
          </div>
          <h1 className="truncate text-[20px] font-extrabold tracking-tight sm:text-[24px]">
            {quiz.topic}
          </h1>
        </div>
      </nav>

      <section
        aria-label="Score"
        className={cn(
          "mb-6 flex flex-col items-center gap-2 rounded-xl border p-6 text-center",
          tone === "success" && "border-success/30 bg-success/5",
          tone === "warning" && "border-warning/30 bg-warning/5",
          tone === "danger" && "border-danger/30 bg-danger/5",
        )}
      >
        <div className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          Score
        </div>
        <div className="text-[44px] font-extrabold leading-none tracking-tight">
          {correct} / {quiz.totalQuestions}
        </div>
        <div
          className={cn(
            "text-[15px] font-bold",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "danger" && "text-danger",
          )}
        >
          {pct}%
        </div>
      </section>

      <div className="mb-6 flex gap-2">
        <Button asChild fullWidth>
          <Link href="/app/study/new">
            <RefreshCw className="h-4 w-4" aria-hidden />
            New quiz
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete quiz"
        >
          <Trash2 className="h-[18px] w-[18px] text-danger" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {quiz.questions.map((q, i) => (
          <QuestionResultsCard
            key={q.id}
            question={q}
            answer={quiz.answers[q.id]}
            ordinal={i + 1}
          />
        ))}
      </div>
    </div>
  );
}
