import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { toneForPercentage } from "../lib/grading";
import type { EvaluationAnswer } from "../types";

interface EvaluationAnswerCardProps {
  answer: EvaluationAnswer;
}

export function EvaluationAnswerCard({ answer }: EvaluationAnswerCardProps) {
  const pct = answer.max_marks === 0 ? 0 : (answer.marks_awarded / answer.max_marks) * 100;
  const tone = toneForPercentage(pct);

  return (
    <section
      aria-labelledby={`ans-${answer.question_number}-title`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          id={`ans-${answer.question_number}-title`}
          className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          Question {answer.question_number}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold",
            tone === "success" && "bg-success/12 text-success",
            tone === "warning" && "bg-warning/12 text-warning",
            tone === "danger" && "bg-danger/12 text-danger",
            tone === "muted" && "bg-secondary text-muted-foreground",
          )}
        >
          {formatNum(answer.marks_awarded)} / {formatNum(answer.max_marks)}
        </span>
      </div>

      {answer.question_text ? (
        <h3 className="text-balance text-[15px] font-bold leading-snug tracking-tight">
          {answer.question_text}
        </h3>
      ) : null}

      <details className="rounded-md bg-secondary p-3">
        <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Your answer
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
          {answer.student_answer || "—"}
        </p>
      </details>

      {answer.feedback ? (
        <div className="rounded-md bg-accent p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
            Feedback
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-accent-foreground">
            {answer.feedback}
          </p>
        </div>
      ) : null}

      {answer.missing_points.length > 0 ? (
        <FeedbackList
          icon={XCircle}
          label="Missing"
          items={answer.missing_points}
          tone="danger"
        />
      ) : null}

      {answer.strengths.length > 0 ? (
        <FeedbackList
          icon={CheckCircle2}
          label="Strengths"
          items={answer.strengths}
          tone="success"
        />
      ) : null}
    </section>
  );
}

function FeedbackList({
  icon: Icon,
  label,
  items,
  tone,
}: {
  icon: typeof Lightbulb;
  label: string;
  items: string[];
  tone: "success" | "danger";
}) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              "flex items-start gap-2 text-[13.5px] leading-relaxed",
              tone === "success" && "text-foreground",
              tone === "danger" && "text-foreground",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-3.5 w-3.5 flex-shrink-0",
                tone === "success" ? "text-success" : "text-danger",
              )}
              strokeWidth={2}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
