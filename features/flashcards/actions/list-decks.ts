"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { FlashcardDeckListItem, FlashcardDeckSource } from "../types";

/**
 * Recent decks + per-deck counts (total, due, new).
 *
 * "Due" = cards where `due_at <= now()` AND `total_reviews > 0`.
 * "New" = cards where `total_reviews = 0` (never reviewed).
 *
 * We fetch counts in a single query by loading the lightweight card fields
 * for each deck. At current scale (≤ 100 decks × ≤ 40 cards per user) this
 * is a rounding error; once someone crosses ~5000 cards we'll swap in a
 * `flashcard_deck_stats` view or a materialised summary.
 */
export async function listDecks(
  limit = 30,
): Promise<Result<FlashcardDeckListItem[], ActionError>> {
  const supabase = await getSupabaseServer();

  const { data: decksData, error: decksErr } = await supabase
    .from("flashcard_decks")
    .select(
      `
        id, title, subject_id, source, created_at, updated_at,
        subject:subjects ( name )
      `,
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (decksErr) return err({ code: "DB", message: "Couldn't load your decks." });
  if (!decksData || decksData.length === 0) return ok([]);

  const deckIds = decksData.map((d) => d.id);
  const { data: cardsData, error: cardsErr } = await supabase
    .from("flashcards")
    .select("deck_id, due_at, total_reviews")
    .in("deck_id", deckIds);

  if (cardsErr) return err({ code: "DB", message: "Couldn't load card stats." });

  const now = Date.now();
  const stats = new Map<string, { total: number; due: number; new: number }>();
  for (const card of cardsData ?? []) {
    const s = stats.get(card.deck_id) ?? { total: 0, due: 0, new: 0 };
    s.total += 1;
    if (card.total_reviews === 0) s.new += 1;
    else if (new Date(card.due_at).getTime() <= now) s.due += 1;
    stats.set(card.deck_id, s);
  }

  return ok(
    decksData.map((row) => {
      const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
      const s = stats.get(row.id) ?? { total: 0, due: 0, new: 0 };
      return {
        id: row.id,
        title: row.title,
        subjectId: row.subject_id,
        subjectName: subject?.name ?? "—",
        source: row.source as FlashcardDeckSource,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        totalCards: s.total,
        dueCards: s.due,
        newCards: s.new,
      };
    }),
  );
}
