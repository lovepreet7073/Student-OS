"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { ChatConversationWithMessages, ChatRole } from "../types";

export async function getConversation(
  id: string,
): Promise<Result<ChatConversationWithMessages, ActionError>> {
  const supabase = await getSupabaseServer();

  const [convRes, msgRes] = await Promise.all([
    supabase
      .from("chat_conversations")
      .select(
        `id, user_id, subject_id, title, created_at, updated_at,
         subject:subjects ( name )`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (convRes.error) return err({ code: "DB", message: "Couldn't load chat." });
  if (!convRes.data) return err({ code: "NOT_FOUND", message: "Chat not found." });

  const subject = Array.isArray(convRes.data.subject)
    ? convRes.data.subject[0]
    : convRes.data.subject;

  return ok({
    id: convRes.data.id,
    userId: convRes.data.user_id,
    subjectId: convRes.data.subject_id,
    subjectName: subject?.name ?? null,
    title: convRes.data.title,
    createdAt: convRes.data.created_at,
    updatedAt: convRes.data.updated_at,
    messages: (msgRes.data ?? []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      role: m.role as ChatRole,
      content: m.content,
      createdAt: m.created_at,
    })),
  });
}
