"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { QuizQuestion } from "../types";

interface QuestionTakerCardProps {
  question: QuizQuestion;
  ordinal: number;
  totalOrdinals: number;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

/**
 * Render one question in TAKE mode. Type-driven input:
 *   - mcq        → radio-group of the 4 options as tap targets
 *   - true_false → two big buttons
 *   - fill_blank → single-line input
 *   - short_answer → textarea
 */
export function QuestionTakerCard({
  question,
  ordinal,
  totalOrdinals,
  value,
  onChange,
  disabled,
}: QuestionTakerCardProps) {
  return (
    <section
      aria-labelledby={`q-${question.id}-title`}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
          Question {ordinal} of {totalOrdinals}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {typeLabel(question.type)}
        </span>
      </div>

      <h2
        id={`q-${question.id}-title`}
        className="text-balance text-[17px] font-bold leading-snug tracking-tight sm:text-[18px]"
      >
        {question.question}
      </h2>

      {question.type === "mcq" ? (
        <div role="radiogroup" className="flex flex-col gap-2.5">
          {question.options.map((opt) => {
            const on = value === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={cn(
                  "flex min-h-[52px] items-center gap-3 rounded-md border p-3.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  on
                    ? "border-2 border-primary bg-accent text-accent-foreground"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    on ? "border-primary" : "border-border",
                  )}
                >
                  {on ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="text-[15px] font-semibold">{opt}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {question.type === "true_false" ? (
        <div role="radiogroup" className="grid grid-cols-2 gap-2.5">
          {(["true", "false"] as const).map((opt) => {
            const on = value === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={cn(
                  "flex h-14 items-center justify-center rounded-md border text-[16px] font-extrabold capitalize transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  on
                    ? "border-2 border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : null}

      {question.type === "fill_blank" ? (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          autoCapitalize="off"
          autoCorrect="off"
        />
      ) : null}

      {question.type === "short_answer" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Write your answer in 1–3 sentences…"
          rows={4}
        />
      ) : null}
    </section>
  );
}

function typeLabel(type: QuizQuestion["type"]): string {
  switch (type) {
    case "mcq":          return "Multiple choice";
    case "true_false":   return "True / False";
    case "fill_blank":   return "Fill in the blank";
    case "short_answer": return "Short answer";
  }
}
