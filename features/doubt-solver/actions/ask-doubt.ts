"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getGeminiModel } from "@/lib/gemini/client";
import { buildDoubtPrompt } from "@/lib/gemini/prompts/doubt";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { askDoubtSchema, type AskDoubtInput } from "../schemas";

/**
 * Inserts a `processing` row, calls Gemini synchronously, updates the row to
 * `answered` (with the response) or `failed` (with an error). Redirects to
 * the detail page on success so the student sees the answer immediately.
 *
 * We don't stream because the doubt is usually short and the student is
 * expecting a "loading..." then "answer" flow, not a chat. Streaming can come
 * in v2 when we add multi-turn conversations.
 */
export async function askDoubt(
  input: AskDoubtInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = askDoubtSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your question.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();

  const subjectId = parsed.data.subjectId ?? null;
  const subject = subjectId
    ? profile.subjects.find((s) => s.id === subjectId)
    : undefined;

  // 1. Insert the placeholder row so the user has a permalink immediately.
  const insertRes = await supabase
    .from("ai_doubts")
    .insert({
      user_id: profile.userId,
      subject_id: subjectId,
      question: parsed.data.question,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data) {
    return err({ code: "DB", message: "Couldn't save your question." });
  }
  const doubtId = insertRes.data.id;

  // 2. Ask Gemini. Any failure flips the row to `failed` — never leaves it
  //    dangling as `processing`.
  try {
    const model = getGeminiModel("gemini-1.5-flash");
    const prompt = buildDoubtPrompt({
      profile,
      subjectName: subject?.name ?? null,
      question: parsed.data.question,
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    if (answer.length === 0) {
      throw new Error("Gemini returned an empty response.");
    }

    const updateRes = await supabase
      .from("ai_doubts")
      .update({ answer, status: "answered" })
      .eq("id", doubtId)
      .eq("user_id", profile.userId);

    if (updateRes.error) {
      return err({ code: "DB", message: "Couldn't save the answer." });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    await supabase
      .from("ai_doubts")
      .update({ status: "failed", error_message: message.slice(0, 500) })
      .eq("id", doubtId)
      .eq("user_id", profile.userId);
    return err({
      code: "UNKNOWN",
      message: "AI couldn't answer this one. Try rephrasing.",
    });
  }

  revalidatePath("/app/doubt");
  redirect(`/app/doubt/${doubtId}`);
}
