"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({
  messageId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, "Message can't be empty")
    .max(4000, "Trim your message — keep it under 4000 characters"),
});
export type EditMessageInput = z.infer<typeof inputSchema>;

/**
 * Edits a `role='user'` chat message in place AND deletes every message
 * that came after it in the same conversation. The trailing messages
 * become invalid the moment we change what the student said — the
 * downstream assistant reply and any further turns were reasoning about
 * a prompt that no longer exists.
 *
 * The client is expected to follow this action with a call to the chat
 * API in `mode: 'regenerate'` to produce a fresh assistant response.
 */
export async function editMessage(
  input: EditMessageInput,
): Promise<Result<{ conversationId: string }, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the edit.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();

  const { data: msg, error: msgErr } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, role, created_at")
    .eq("id", parsed.data.messageId)
    .maybeSingle();

  if (msgErr) return err({ code: "DB", message: "Couldn't load the message." });
  if (!msg) return err({ code: "NOT_FOUND", message: "Message not found." });
  if (msg.role !== "user") {
    return err({
      code: "VALIDATION",
      message: "Only your own messages can be edited.",
    });
  }

  // 1) Delete every message strictly after this one in the same
  //    conversation. RLS scopes the delete to the caller's rows.
  const { error: delErr } = await supabase
    .from("chat_messages")
    .delete()
    .eq("conversation_id", msg.conversation_id)
    .gt("created_at", msg.created_at);
  if (delErr) return err({ code: "DB", message: "Couldn't clear later replies." });

  // 2) Overwrite the target message body. Attachments stay put — the
  //    student is editing the text, not swapping the image.
  const { error: updateErr } = await supabase
    .from("chat_messages")
    .update({ content: parsed.data.content })
    .eq("id", msg.id);
  if (updateErr) return err({ code: "DB", message: "Couldn't save the edit." });

  revalidatePath(`/app/chat/${msg.conversation_id}`);
  return ok({ conversationId: msg.conversation_id });
}
