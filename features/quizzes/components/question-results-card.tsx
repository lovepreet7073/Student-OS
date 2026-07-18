"use client";

import { useState, useTransition } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { selfMark } from "../actions/self-mark";
import type { QuizAnswer, QuizQuestion } from "../types";

interface QuestionResultsCardProps {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  ordinal: number;
}

/**
 * One question rendered in RESULTS mode:
 *   - MCQ / T/F / fill_blank: correct-or-not badge + user answer + correct answer
 *   - short_answer:            user answer + reference answer + self-mark buttons
 * Always shows the explanation below.
 */
export function QuestionResultsCard({
  question,
  answer,
  ordinal,
}: QuestionResultsCardProps) {
  const [pending, startTransition] = useTransition();
  const [selfCorrect, setSelfCorrect] = useState<boolean | null>(
    answer?.selfMarkedCorrect ?? null,
  );
  const autoCorrect = answer?.isCorrect ?? null;
  const isShort = question.type === "short_answer";

  const overallCorrect = isShort ? selfCorrect : autoCorrect;

  const handleSelfMark = (correct: boolean) => {
    if (!answer) return;
    setSelfCorrect(correct);
    startTransition(async () => {
      const result = await selfMark({ answerId: answer.id, correct });
      if (!result.ok) {
        toast.error(result.error.message);
        setSelfCorrect(answer.selfMarkedCorrect ?? null);
      }
    });
  };

  return (
    <section
      aria-labelledby={`qr-${question.id}-title`}
      className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
          Question {ordinal}
        </span>
        <ResultBadge state={overallCorrect} isShort={isShort} />
      </div>

      <h3
        id={`qr-${question.id}-title`}
        className="text-balance text-[16px] font-bold leading-snug tracking-tight"
      >
        {question.question}
      </h3>

      <AnswerBlock
        label="Your answer"
        value={answer?.userAnswer ?? "—"}
        tone={overallCorrect === true ? "success" : overallCorrect === false ? "danger" : "neutral"}
      />

      {question.type !== "short_answer" ? (
        <AnswerBlock label="Correct answer" value={question.correctAnswer} tone="success" />
      ) : (
        <AnswerBlock label="Reference answer" value={question.correctAnswer} tone="neutral" />
      )}

      {question.explanation ? (
        <div className="rounded-md bg-secondary p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Why
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">
            {question.explanation}
          </p>
        </div>
      ) : null}

      {isShort && answer ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3.5">
          <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
            Mark yourself
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSelfMark(true)}
              disabled={pending}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border text-[14px] font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selfCorrect === true
                  ? "border-2 border-success bg-success/10 text-success"
                  : "border-border bg-background hover:border-success/40",
              )}
              aria-pressed={selfCorrect === true}
            >
              <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Got it right
            </button>
            <button
              type="button"
              onClick={() => handleSelfMark(false)}
              disabled={pending}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border text-[14px] font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selfCorrect === false
                  ? "border-2 border-danger bg-danger/10 text-danger"
                  : "border-border bg-background hover:border-danger/40",
              )}
              aria-pressed={selfCorrect === false}
            >
              <X className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              Missed it
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ResultBadge({
  state,
  isShort,
}: {
  state: boolean | null;
  isShort: boolean;
}) {
  if (state === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-bold text-success">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
        Correct
      </span>
    );
  }
  if (state === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2.5 py-1 text-[11px] font-bold text-danger">
        <X className="h-3 w-3" strokeWidth={3} aria-hidden />
        {isShort ? "Missed" : "Incorrect"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
      <HelpCircle className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      Not marked
    </span>
  );
}

function AnswerBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "neutral";
}) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 rounded-md border p-2.5 text-[14px] leading-relaxed",
          tone === "success" && "border-success/30 bg-success/5 text-foreground",
          tone === "danger" && "border-danger/30 bg-danger/5 text-foreground",
          tone === "neutral" && "border-border bg-background text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
