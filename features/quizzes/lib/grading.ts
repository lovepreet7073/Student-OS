import type { QuizQuestion } from "../types";

/**
 * Deterministic auto-grader.
 *   - MCQ / true_false: exact match against `correct_answer`
 *   - fill_blank:      case-insensitive, whitespace-collapsed match
 *   - short_answer:    returns null → surfaces self-mark UI to the student
 */
export function autoGrade(
  question: Pick<QuizQuestion, "type" | "correctAnswer">,
  userAnswer: string,
): boolean | null {
  const raw = userAnswer.trim();
  if (raw.length === 0) return false;

  switch (question.type) {
    case "mcq":
      return raw === question.correctAnswer;
    case "true_false":
      return raw.toLowerCase() === question.correctAnswer.toLowerCase();
    case "fill_blank":
      return normalise(raw) === normalise(question.correctAnswer);
    case "short_answer":
      return null;
  }
}

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}
