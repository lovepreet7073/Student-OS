"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

import type { FlashcardDeckWithCards } from "../types";

export async function getDeck(
  id: string,
): Promise<Result<FlashcardDeckWithCards, ActionError>> {
  const supabase = await getSupabaseServer();

  const [deckRes, cardsRes] = await Promise.all([
    supabase
      .from("flashcard_decks")
      .select(
        `
          id, user_id, board_id, class_id, medium_id, subject_id, title, description,
          source, source_note_id, created_at, updated_at,
          subject:subjects ( name )
        `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("flashcards")
      .select(
        `id, deck_id, ordinal, front, back, hint,
         ease_factor, interval_days, repetition, due_at, last_reviewed_at,
         lapses, total_reviews`,
      )
      .eq("deck_id", id)
      .order("ordinal"),
  ]);

  if (deckRes.error) return err({ code: "DB", message: "Couldn't load deck." });
  if (!deckRes.data) return err({ code: "NOT_FOUND", message: "Deck not found." });

  const subject = Array.isArray(deckRes.data.subject)
    ? deckRes.data.subject[0]
    : deckRes.data.subject;

  await logActivity({
    entityType: "flashcard_deck",
    entityId: deckRes.data.id,
    action: "opened",
    title: deckRes.data.title,
  });

  return ok({
    id: deckRes.data.id,
    userId: deckRes.data.user_id,
    boardId: deckRes.data.board_id,
    classId: deckRes.data.class_id,
    mediumId: deckRes.data.medium_id,
    subjectId: deckRes.data.subject_id,
    subjectName: subject?.name ?? "—",
    title: deckRes.data.title,
    description: deckRes.data.description,
    source: deckRes.data.source as FlashcardDeckWithCards["source"],
    sourceNoteId: deckRes.data.source_note_id,
    createdAt: deckRes.data.created_at,
    updatedAt: deckRes.data.updated_at,
    cards: (cardsRes.data ?? []).map((c) => ({
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
  });
}
