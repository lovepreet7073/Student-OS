"use server";

import { z } from "zod";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getGeminiModel } from "@/lib/gemini/client";
import { buildFileAiPrompt, type FileAiAction } from "@/lib/gemini/prompts/file-ai";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { STORAGE_BUCKET } from "../lib/mime";

const inputSchema = z.object({
  fileId: z.string().uuid(),
  action: z.enum(["summarize", "key-points", "explain-simpler"]),
});

export type FileAiInput = z.infer<typeof inputSchema>;
export type FileAiOutput = { text: string; action: FileAiAction };

/** Gemini 1.5 Flash accepts ~20 MB inline. We cap slightly under to leave room for the prompt. */
const MAX_INLINE_BYTES = 15 * 1024 * 1024;

/**
 * On-demand AI action against an uploaded document (PDF or image).
 *
 *   1. Verify the caller owns the file (belt AND braces: RLS + `.eq user_id`).
 *   2. Download bytes from private Storage (server-side, service-role not
 *      needed — the user's session works fine because they own the row).
 *   3. Base64-encode and send inline to Gemini alongside the prompt.
 *   4. Return the free-form Markdown result — no schema, no persistence.
 *
 * Files over MAX_INLINE_BYTES are rejected client-side but re-checked here.
 * A future iteration can chunk-upload to the Gemini File API for larger PDFs.
 */
export async function runFileAiAction(
  input: FileAiInput,
): Promise<Result<FileAiOutput, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid input." });
  }

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();

  const { data: file, error: fileErr } = await supabase
    .from("study_files")
    .select("id, user_id, file_name, mime_type, size_bytes, storage_path, subject:subjects ( name )")
    .eq("id", parsed.data.fileId)
    .eq("user_id", profile.userId)
    .maybeSingle();

  if (fileErr) return err({ code: "DB", message: "Couldn't load the file." });
  if (!file) return err({ code: "NOT_FOUND", message: "File not found." });

  if (file.size_bytes > MAX_INLINE_BYTES) {
    return err({
      code: "VALIDATION",
      message: "File is too large for AI (over 15 MB). Try a smaller PDF or image.",
    });
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(file.storage_path);

  if (dlErr || !blob) {
    return err({ code: "DB", message: "Couldn't fetch the file bytes." });
  }

  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const subject = Array.isArray(file.subject) ? file.subject[0] : file.subject;

  try {
    const model = getGeminiModel("gemini-1.5-flash");
    const prompt = buildFileAiPrompt({
      profile,
      subjectName: subject?.name ?? "General",
      fileName: file.file_name,
      action: parsed.data.action,
    });

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: file.mime_type, data: base64 } },
    ]);
    const text = result.response.text().trim();

    if (text.length === 0) {
      return err({ code: "UNKNOWN", message: "AI returned an empty response. Try again." });
    }

    return ok({ text, action: parsed.data.action });
  } catch (e) {
    console.error("[runFileAiAction] gemini failed", e);
    return err({
      code: "UNKNOWN",
      message: "AI is unavailable right now. Try again in a moment.",
    });
  }
}
