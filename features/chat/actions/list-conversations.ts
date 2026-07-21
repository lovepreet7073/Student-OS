"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { ChatConversationListItem } from "../types";

/**
 * Recent conversations for the sidebar. Includes a one-line preview of
 * the last message so the list feels alive.
 */
export async function listConversations(
  limit = 30,
): Promise<Result<ChatConversationListItem[], ActionError>> {
  const supabase = await getSupabaseServer();

  const { data: convsData, error: convsErr } = await supabase
    .from("chat_conversations")
    .select(
      `id, title, subject_id, updated_at,
       subject:subjects ( name )`,
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (convsErr) return err({ code: "DB", message: "Couldn't load chats." });
  if (!convsData || convsData.length === 0) return ok([]);

  const ids = convsData.map((c) => c.id);
  const { data: lastMsgs } = await supabase
    .from("chat_messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false })
    .limit(ids.length * 4);

  const previewByConv = new Map<string, string>();
  for (const m of lastMsgs ?? []) {
    if (previewByConv.has(m.conversation_id)) continue;
    previewByConv.set(
      m.conversation_id,
      m.content.length > 90 ? `${m.content.slice(0, 87)}…` : m.content,
    );
  }

  return ok(
    convsData.map((row) => {
      const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
      return {
        id: row.id,
        title: row.title,
        subjectId: row.subject_id,
        subjectName: subject?.name ?? null,
        updatedAt: row.updated_at,
        lastMessagePreview: previewByConv.get(row.id) ?? "",
      };
    }),
  );
}
