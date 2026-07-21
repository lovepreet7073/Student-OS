"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({
  conversationId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(1, "Title can't be empty")
    .max(200, "Title is too long"),
});
export type RenameConversationInput = z.infer<typeof inputSchema>;

export async function renameConversation(
  input: RenameConversationInput,
): Promise<Result<null, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Please check the title." });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("chat_conversations")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.conversationId);

  if (error) return err({ code: "DB", message: "Couldn't rename this chat." });

  revalidatePath("/app/chat");
  revalidatePath(`/app/chat/${parsed.data.conversationId}`);
  return ok(null);
}
