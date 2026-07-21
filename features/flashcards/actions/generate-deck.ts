"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getStudentContext } from "@/lib/gemini/context";
import { buildFlashcardsPrompt } from "@/lib/gemini/prompts/flashcards";
import { generateStructured, AIStructuredError } from "@/lib/gemini/structured";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { generateDeckSchema, type GenerateDeckInput } from "../schemas/deck";
import { geminiFlashcardsResponseSchema } from "../schemas/gemini";

/**
 * Generates a flashcard deck from a topic (and optionally from a note the
 * student already owns). Same shape as `generateQuiz`:
 *   1. Validate input
 *   2. Confirm subject is in the student's scope
 *   3. If `sourceNoteId` is provided, load the note body (RLS guarantees
 *      ownership) and inject it into the prompt so the deck stays grounded
 *   4. Ask Gemini for JSON via `generateStructured`, retry once
 *   5. Insert deck + cards; best-effort delete of the deck if cards insert fails
 */
export async function generateDeck(
  input: GenerateDeckInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = generateDeckSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the deck settings.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  if (!scope.subjectIds.includes(parsed.data.subjectId)) {
    return err({
      code: "VALIDATION",
      message: "Pick a subject from your profile.",
      fieldErrors: { subjectId: ["Not in your active subjects"] },
    });
  }

  const ctx = await getStudentContext();
  if (!ctx) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const { data: subjectRow, error: subjectErr } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", parsed.data.subjectId)
    .single();
  if (subjectErr || !subjectRow) {
    return err({ code: "NOT_FOUND", message: "Subject not found." });
  }

  // If sourcing from a note, fetch the body so the prompt can extract from it.
  // RLS on `notes` filters to this user — no extra check needed.
  let sourceText: string | undefined;
  if (parsed.data.sourceNoteId) {
    const { data: noteRow } = await supabase
      .from("notes")
      .select("title, content")
      .eq("id", parsed.data.sourceNoteId)
      .maybeSingle();
    if (noteRow) {
      sourceText = `${noteRow.title}\n\n${noteRow.content}`;
    }
  }

  // ---- Call Gemini ----
  let aiResult;
  try {
    aiResult = await generateStructured({
      prompt: buildFlashcardsPrompt({
        ctx,
        subjectName: subjectRow.name,
        topic: parsed.data.topic,
        cardCount: parsed.data.cardCount,
        sourceText,
      }),
      schema: geminiFlashcardsResponseSchema,
      maxRetries: 1,
    });
  } catch (e) {
    if (e instanceof AIStructuredError) {
      return err({
        code: "AI",
        message: "The AI couldn't generate a valid deck. Try a more specific topic.",
      });
    }
    return err({
      code: "AI",
      message: "AI service is unavailable right now. Please try again.",
    });
  }

  // ---- Persist ----
  const { data: deckRow, error: deckErr } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      subject_id: parsed.data.subjectId,
      title: parsed.data.topic,
      description: sourceText ? "Generated from a note" : "",
      source: sourceText ? "ai_note" : "ai_topic",
      source_note_id: parsed.data.sourceNoteId ?? null,
      raw_gemini_response: aiResult.data,
    })
    .select("id")
    .single();

  if (deckErr || !deckRow) {
    return err({ code: "DB", message: "Couldn't save the deck. Try again." });
  }

  const cardRows = aiResult.data.cards.map((c, i) => ({
    deck_id: deckRow.id,
    user_id: scope.userId,
    ordinal: i + 1,
    front: c.front,
    back: c.back,
    hint: c.hint,
    // Everything else falls back to the column defaults: ease 2.5, interval 0,
    // repetition 0, due_at now(), so brand-new cards are picked up on the
    // student's first review session.
  }));

  const { error: cErr } = await supabase.from("flashcards").insert(cardRows);
  if (cErr) {
    await supabase.from("flashcard_decks").delete().eq("id", deckRow.id);
    return err({ code: "DB", message: "Couldn't save the cards. Try again." });
  }

  revalidatePath("/app/flashcards");

  return ok({ id: deckRow.id });
}
