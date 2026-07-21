"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { applySm2 } from "../lib/sm2";
import { reviewCardSchema, type ReviewCardInput } from "../schemas/deck";
import type { CardReviewState } from "../types";

/**
 * Applies SM-2 to a single card review. Idempotency isn't guaranteed — if
 * the client sends the same tap twice, both will apply (the second will
 * mildly perturb ease/interval). Fine for MVP; we can hash by
 * (card_id, last_reviewed_at) if it becomes an issue.
 */
export async function reviewCard(
  input: ReviewCardInput,
): Promise<Result<CardReviewState, ActionError>> {
  const parsed = reviewCardSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Couldn't record that review." });
  }

  const supabase = await getSupabaseServer();

  const { data: card, error: fetchErr } = await supabase
    .from("flashcards")
    .select(
      "id, deck_id, ease_factor, interval_days, repetition, lapses, total_reviews",
    )
    .eq("id", parsed.data.cardId)
    .maybeSingle();

  if (fetchErr) return err({ code: "DB", message: "Couldn't load the card." });
  if (!card) return err({ code: "NOT_FOUND", message: "Card not found." });

  const next = applySm2(
    {
      easeFactor: card.ease_factor,
      intervalDays: card.interval_days,
      repetition: card.repetition,
      lapses: card.lapses,
      totalReviews: card.total_reviews,
    },
    parsed.data.quality,
  );

  const { error: updateErr } = await supabase
    .from("flashcards")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetition: next.repetition,
      due_at: next.dueAt,
      last_reviewed_at: next.lastReviewedAt,
      lapses: next.lapses,
      total_reviews: next.totalReviews,
    })
    .eq("id", card.id);

  if (updateErr) return err({ code: "DB", message: "Couldn't save the review." });

  // Bump the deck's updated_at so it floats to the top of the list.
  await supabase
    .from("flashcard_decks")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", card.deck_id);

  revalidatePath(`/app/flashcards/${card.deck_id}`);

  return ok(next);
}
