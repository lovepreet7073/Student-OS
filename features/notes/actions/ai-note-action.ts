"use server";

import { z } from "zod";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getGeminiModel } from "@/lib/gemini/client";
import { buildNoteAiPrompt, type NoteAiAction } from "@/lib/gemini/prompts/note-ai";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({
  noteId: z.string().uuid(),
  action: z.enum(["summarize", "explain-simpler", "key-points"]),
});

export type NoteAiInput = z.infer<typeof inputSchema>;
export type NoteAiOutput = { text: string; action: NoteAiAction };

/**
 * On-demand AI transformation of a saved note. One prompt, three intents:
 *   - summarize        → 5-8 tight bullets
 *   - explain-simpler  → same content, Class 8 vocabulary
 *   - key-points       → facts, formulas, definitions, dates
 *
 * Nothing is saved to the DB — the result is returned to the client and
 * rendered in a dialog. If the student wants to keep it, they can copy it or
 * (future) tap "Save as new note".
 */
export async function runNoteAiAction(
  input: NoteAiInput,
): Promise<Result<NoteAiOutput, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid input." });
  }

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();

  const noteRes = await supabase
    .from("notes")
    .select("id, user_id, title, content, subject:subjects ( name )")
    .eq("id", parsed.data.noteId)
    .maybeSingle();

  if (noteRes.error) return err({ code: "DB", message: "Couldn't load the note." });
  if (!noteRes.data) return err({ code: "NOT_FOUND", message: "Note not found." });
  if (noteRes.data.user_id !== profile.userId) {
    return err({ code: "FORBIDDEN", message: "Not your note." });
  }

  const content = (noteRes.data.content ?? "").trim();
  if (content.length === 0) {
    return err({ code: "VALIDATION", message: "This note is empty — add some content first." });
  }

  const subject = Array.isArray(noteRes.data.subject)
    ? noteRes.data.subject[0]
    : noteRes.data.subject;

  try {
    const model = getGeminiModel("gemini-1.5-flash");
    const prompt = buildNoteAiPrompt({
      profile,
      subjectName: subject?.name ?? "General",
      noteTitle: noteRes.data.title,
      noteContent: content,
      action: parsed.data.action,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (text.length === 0) {
      return err({ code: "UNKNOWN", message: "AI returned an empty response. Try again." });
    }

    return ok({ text, action: parsed.data.action });
  } catch (e) {
    console.error("[runNoteAiAction] gemini failed", e);
    return err({
      code: "UNKNOWN",
      message: "AI is unavailable right now. Try again in a moment.",
    });
  }
}
