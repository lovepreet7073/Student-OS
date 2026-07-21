"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Flashcard } from "../types";

/**
 * Cross-deck review inbox — every card the caller owns that is due for
 * review (either brand-new or past its `due_at`).
 *
 * Interleaves cards from every deck so a student who has five decks can
 * clear their queue without switching contexts. Ordered by `due_at asc`
 * so the most-overdue cards surface first; brand-new cards (due_at = now)
 * naturally cluster near the top.
 *
 * Capped at `limit` (default 60) to keep a session bounded — a 100-card
 * session would burn out anyone.
 */
export async function listDueCards(
  limit = 60,
): Promise<Result<Flashcard[], ActionError>> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("flashcards")
    .select(
      `id, deck_id, ordinal, front, back, hint,
       ease_factor, interval_days, repetition, due_at, last_reviewed_at,
       lapses, total_reviews`,
    )
    .eq("user_id", user.id)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(limit);

  if (error) return err({ code: "DB", message: "Couldn't load due cards." });

  return ok(
    (data ?? []).map((c) => ({
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
