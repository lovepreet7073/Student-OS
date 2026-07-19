import type { EvaluationGrade, ExamType } from "../types";

/** Recomputes the grade from a percentage (0-100). Used as a fallback if
 * the AI returned an inconsistent grade → we prefer the arithmetic. */
export function gradeForPercentage(pct: number): EvaluationGrade {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

/** Human label for exam type — used across UI. */
export function examTypeLabel(t: ExamType): string {
  switch (t) {
    case "unit_test":    return "Unit test";
    case "chapter_test": return "Chapter test";
    case "board_model":  return "Board-style test";
    case "practice":     return "Practice test";
    case "other":        return "Test";
  }
}

/** Tone bucket used for score / grade badge tinting. */
export type ScoreTone = "success" | "warning" | "danger" | "muted";

export function toneForPercentage(pct: number | null): ScoreTone {
  if (pct === null || Number.isNaN(pct)) return "muted";
  if (pct >= 75) return "success";
  if (pct >= 40) return "warning";
  return "danger";
}
