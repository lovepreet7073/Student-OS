"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { submitQuiz } from "../actions/submit-quiz";
import type { QuizWithQuestions } from "../types";
import { QuestionTakerCard } from "./question-taker-card";

interface QuizTakerProps {
  quiz: QuizWithQuestions;
}

export function QuizTaker({ quiz }: QuizTakerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, startTransition] = useTransition();

  const answered = useMemo(
    () => Object.values(answers).filter((v) => v.trim().length > 0).length,
    [answers],
  );
  const total = quiz.questions.length;
  const allAnswered = answered === total;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      toast.warning("Answer every question before submitting.");
      return;
    }
    startTransition(async () => {
      const result = await submitQuiz({
        quizId: quiz.id,
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          answer: answers[q.id] ?? "",
        })),
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      // Server revalidates — force a router refresh so the results view renders.
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-24 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to Study" className="mb-4 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/study">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {quiz.subjectName}
          </div>
          <h1 className="truncate text-[20px] font-extrabold tracking-tight sm:text-[24px]">
            {quiz.topic}
          </h1>
        </div>
      </nav>

      <div className="sticky top-0 z-10 -mx-5 mb-5 flex items-center justify-between border-b border-border bg-background/85 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7 lg:-mx-11 lg:px-11">
        <span className="text-[13px] font-bold text-muted-foreground">
          {answered} / {total} answered
        </span>
        <div className="ml-4 h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {quiz.questions.map((q, i) => (
          <QuestionTakerCard
            key={q.id}
            question={q}
            ordinal={i + 1}
            totalOrdinals={total}
            value={answers[q.id] ?? ""}
            onChange={(v) => handleAnswer(q.id, v)}
            disabled={submitting}
          />
        ))}

        <div className="sticky bottom-0 -mx-5 mt-2 border-t border-border bg-background/90 px-5 pb-safe pt-3.5 backdrop-blur sm:-mx-7 sm:px-7 lg:-mx-11 lg:px-11">
          <div className="pb-3.5">
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={!allAnswered || submitting}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Submit quiz
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
