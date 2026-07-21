"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export interface DeckStats {
  totalReviews: number;
  correctReviews: number;
  retentionPercent: number | null;
  reviewsLast7Days: number;
}

/**
 * Aggregate stats for a deck's review history. Used by the deck detail view
 * to render a retention percentage — the fraction of reviews rated 'good' or
 * 'easy', which is the standard measure of long-term recall in SRS systems.
 *
 * `retentionPercent` is `null` when the student hasn't reviewed anything
 * yet — showing "0%" would falsely imply they've failed everything.
 *
 * Small deck-scoped queries — no COUNT/GROUP BY RPC needed. Grouping is
 * one loop over ≤ ~1000 rows (a heavily-used deck).
 */
export async function getDeckStats(
  deckId: string,
): Promise<Result<DeckStats, ActionError>> {
  const supabase = await getSupabaseServer();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekIso = weekAgo.toISOString();

  const [totalRes, correctRes, weekRes] = await Promise.all([
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("deck_id", deckId),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("deck_id", deckId)
      .in("quality", ["good", "easy"]),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("deck_id", deckId)
      .gte("reviewed_at", weekIso),
  ]);

  if (totalRes.error || correctRes.error || weekRes.error) {
    return err({ code: "DB", message: "Couldn't load deck stats." });
  }

  const total = totalRes.count ?? 0;
  const correct = correctRes.count ?? 0;
  const weekCount = weekRes.count ?? 0;

  return ok({
    totalReviews: total,
    correctReviews: correct,
    retentionPercent: total === 0 ? null : Math.round((correct / total) * 100),
    reviewsLast7Days: weekCount,
  });
}
