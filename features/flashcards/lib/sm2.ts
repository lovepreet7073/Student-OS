import type { CardReviewState, Flashcard, ReviewQuality } from "../types";

/**
 * SM-2 spaced repetition algorithm.
 *
 * Reference: Piotr Wozniak's SuperMemo-2 (1985) — the ancestor of every
 * modern flashcard scheduler (Anki, Mnemosyne, etc.).
 *
 * Quality mapping (0–5 in the original):
 *   again → 0   (blackout)
 *   hard  → 3   (correct with serious difficulty)
 *   good  → 4   (correct after hesitation)
 *   easy  → 5   (perfect recall)
 *
 * Behaviour:
 *   quality < 3 → repetition resets to 0, interval to 1 day, lapses++
 *   quality ≥ 3 → repetition increments;
 *                 interval sequence: 1 day, 6 days, then × ease_factor
 *   ease_factor is nudged by the quality delta, clamped to [1.3, 4.0]
 *
 * Pure function — takes the current state, returns the next state.
 * Persistence is the caller's problem.
 */
export function applySm2(
  prev: Pick<
    Flashcard,
    "easeFactor" | "intervalDays" | "repetition" | "lapses" | "totalReviews"
  >,
  quality: ReviewQuality,
  now: Date = new Date(),
): CardReviewState {
  const q = QUALITY_SCORE[quality];

  let repetition = prev.repetition;
  let interval = prev.intervalDays;
  let lapses = prev.lapses;

  if (q < 3) {
    repetition = 0;
    interval = 1;
    lapses += 1;
  } else {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * prev.easeFactor);
    repetition += 1;
  }

  const nextEase = clampEase(
    prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  const due = new Date(now.getTime());
  due.setDate(due.getDate() + interval);

  return {
    easeFactor: nextEase,
    intervalDays: interval,
    repetition,
    dueAt: due.toISOString(),
    lapses,
    totalReviews: prev.totalReviews + 1,
    lastReviewedAt: now.toISOString(),
  };
}

const QUALITY_SCORE: Record<ReviewQuality, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

function clampEase(v: number): number {
  if (Number.isNaN(v)) return 2.5;
  if (v < 1.3) return 1.3;
  if (v > 4.0) return 4.0;
  // Round to 2 decimals so we don't drift into ugly floats in the DB.
  return Math.round(v * 100) / 100;
}
