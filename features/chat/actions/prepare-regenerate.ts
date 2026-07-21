"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({
  conversationId: z.string().uuid(),
});
export type PrepareRegenerateInput = z.infer<typeof inputSchema>;

/**
 * Deletes the trailing assistant message on a conversation so the API
 * route can produce a fresh reply for the same user question.
 *
 * Returns the text of the user message that will be re-answered so the
 * client can hand it to the streaming request without another round-trip.
 * If the conversation ends with a user message (no assistant reply yet),
 * we just return that user message content unchanged — nothing to delete.
 */
export async function prepareRegenerate(
  input: PrepareRegenerateInput,
): Promise<Result<{ userContent: string }, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Couldn't prepare regenerate." });
  }

  const supabase = await getSupabaseServer();

  const { data: last, error: readErr } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", parsed.data.conversationId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (readErr) return err({ code: "DB", message: "Couldn't load the chat." });
  if (!last || last.length === 0) {
    return err({ code: "NOT_FOUND", message: "Chat has no messages." });
  }

  const [tail, prior] = last;

  if (tail.role === "assistant") {
    // Delete the trailing assistant message; the prior row must be a
    // user turn we can re-answer.
    if (!prior || prior.role !== "user") {
      return err({
        code: "VALIDATION",
        message: "Nothing to regenerate — no user question found.",
      });
    }
    const { error: delErr } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", tail.id);
    if (delErr) return err({ code: "DB", message: "Couldn't clear the last reply." });
    revalidatePath(`/app/chat/${parsed.data.conversationId}`);
    return ok({ userContent: prior.content });
  }

  // Tail is already a user message (e.g. immediately after an edit).
  return ok({ userContent: tail.content });
}
