import { BookOpen, CheckCircle2, Clock, Sparkles } from "lucide-react";

import type { Audience } from "../types";

interface LandingPreviewProps {
  audience: Audience;
}

/**
 * Soft product preview that lives beside the hero (slide 3).
 * Renders a static "peek" of the dashboard so visitors can see what StudyOS
 * feels like before signing up.
 */
export function LandingPreview({ audience }: LandingPreviewProps) {
  const isTeacher = audience === "teacher";
  const chipLabel = isTeacher ? "Today's classes" : "Continue where you left off";
  const cardTitle = isTeacher ? "Grade 10 · Cell Structure" : "Class 10 · Cell Structure";
  const cardSubtitle = isTeacher ? "Biology · 32 students" : "Biology · Chapter 5";

  return (
    <div
      aria-hidden
      className="relative isolate mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.25)] sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent"
      />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.4} />
          {chipLabel}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">Today</span>
      </div>

      <div className="relative mt-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold">{cardTitle}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {cardSubtitle}
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[64%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>

      <ul className="relative mt-3 flex flex-col gap-2">
        {[
          { icon: Clock, label: isTeacher ? "20 min lesson plan" : "20 min review session" },
          { icon: CheckCircle2, label: isTeacher ? "3 tests to grade" : "3 practice sets ready" },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-[12.5px] font-semibold"
          >
            <row.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            <span>{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
