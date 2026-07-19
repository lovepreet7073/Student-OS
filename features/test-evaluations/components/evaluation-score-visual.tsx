import { cn } from "@/lib/utils";

import { toneForPercentage, type ScoreTone } from "../lib/grading";
import type { EvaluationGrade } from "../types";

interface EvaluationScoreVisualProps {
  score: number;
  maxMarks: number;
  percentage: number;
  grade: EvaluationGrade;
}

const TONE_CLASS: Record<ScoreTone, string> = {
  success: "border-success/40 bg-success/5",
  warning: "border-warning/40 bg-warning/5",
  danger:  "border-danger/40 bg-danger/5",
  muted:   "border-border bg-card",
};

const GRADE_TEXT_TONE: Record<ScoreTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger:  "text-danger",
  muted:   "text-muted-foreground",
};

export function EvaluationScoreVisual({
  score,
  maxMarks,
  percentage,
  grade,
}: EvaluationScoreVisualProps) {
  const tone = toneForPercentage(percentage);
  return (
    <section
      aria-label="Score"
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-6 text-center",
        TONE_CLASS[tone],
      )}
    >
      <div className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
        Score
      </div>
      <div className="text-[44px] font-extrabold leading-none tracking-tight">
        {formatMarks(score)} <span className="text-[24px] text-muted-foreground">/ {maxMarks}</span>
      </div>
      <div className="flex items-center gap-3 text-[15px] font-bold">
        <span className={GRADE_TEXT_TONE[tone]}>{percentage.toFixed(1)}%</span>
        <span aria-hidden className="h-4 w-px bg-border" />
        <span className={cn("text-[18px] font-extrabold", GRADE_TEXT_TONE[tone])}>{grade}</span>
      </div>
    </section>
  );
}

function formatMarks(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
