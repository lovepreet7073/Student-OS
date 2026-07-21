"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Flashcard } from "../types";

/**
 * Cards the student has struggled with. Same lapse threshold as the
 * deck-detail "Needs more practice" section (Module 38):
 *   total_reviews >= 3 AND lapses / total_reviews > 0.3
 *
 * A single miss won't tag a card as weak (min 3 reviews); we drop
 * cards where roughly two-thirds of reviews were correct or better.
 * Ordered by lapse ratio DESC so the toughest cards surface first.
 *
 * The lapses-per-reviews ratio can't be expressed as a Supabase-JS
 * filter (no computed comparisons), so we pull the candidate set with
 * `total_reviews >= 3` and finish filtering in JS. At current scale
 * (worst case ~a few thousand rows per user) that's a rounding error.
 */
export async function listWeakCards(
  limit = 60,
): Promise<Result<Flashcard[], ActionError>> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("flashcards")
    .select(
      `id, deck_id, ordinal, front, back, hint,
       ease_factor, interval_days, repetition, due_at, last_reviewed_at,
       lapses, total_reviews`,
    )
    .eq("user_id", user.id)
    .gte("total_reviews", 3)
    .order("lapses", { ascending: false })
    .limit(limit * 3);

  if (error) return err({ code: "DB", message: "Couldn't load weak cards." });

  const filtered = (data ?? [])
    .filter((c) => c.total_reviews >= 3 && c.lapses / c.total_reviews > 0.3)
    .slice(0, limit);

  return ok(
    filtered.map((c) => ({
      id: c.id,
      deckId: c.deck_id,
      ordinal: c.ordinal,
      front: c.front,
      back: c.back,
      hint: c.hint,
      easeFactor: c.ease_factor,
      intervalDays: c.interval_days,
      repetition: c.repetition,
      dueAt: c.due_at,
      lastReviewedAt: c.last_reviewed_at,
      lapses: c.lapses,
      totalReviews: c.total_reviews,
    })),
  );
}
