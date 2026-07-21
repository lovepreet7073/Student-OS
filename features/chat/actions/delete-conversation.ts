"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  deleteConversationSchema,
  type DeleteConversationInput,
} from "../schemas/chat";

export async function deleteConversation(
  input: DeleteConversationInput,
): Promise<Result<null, ActionError>> {
  const parsed = deleteConversationSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Couldn't delete the chat." });
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", parsed.data.conversationId);

  if (error) return err({ code: "DB", message: "Couldn't delete the chat." });

  revalidatePath("/app/chat");
  return ok(null);
}
