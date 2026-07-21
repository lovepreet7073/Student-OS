"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

const inputSchema = z.object({
  conversationId: z.string().uuid(),
  subjectId: z.string().uuid("Choose a subject"),
});
export type SaveConversationAsNoteInput = z.infer<typeof inputSchema>;

/**
 * Flattens a whole chat conversation into a single note. Each turn is
 * rendered as a "**You:** …" / "**AI:** …" block so the note stays
 * readable in the plain-text note reader.
 *
 * Only text is copied. Attachment images stay in the chat — a note
 * doesn't have an image field yet, and re-uploading them into notes
 * would fork the storage lifecycle for no gain.
 */
export async function saveConversationAsNote(
  input: SaveConversationAsNoteInput,
): Promise<Result<{ noteId: string }, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Couldn't save this chat.",
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

  const supabase = await getSupabaseServer();

  const [convRes, msgRes] = await Promise.all([
    supabase
      .from("chat_conversations")
      .select("id, title")
      .eq("id", parsed.data.conversationId)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select("role, content, attachments, created_at")
      .eq("conversation_id", parsed.data.conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (convRes.error) return err({ code: "DB", message: "Couldn't load chat." });
  if (!convRes.data) return err({ code: "NOT_FOUND", message: "Chat not found." });

  const messages = msgRes.data ?? [];
  if (messages.length === 0) {
    return err({ code: "VALIDATION", message: "This chat is empty." });
  }

  const body = messages
    .map((m) => {
      const speaker = m.role === "user" ? "**You:**" : "**AI:**";
      const attachmentNote =
        Array.isArray(m.attachments) && m.attachments.length > 0
          ? `\n_[${m.attachments.length} attachment${m.attachments.length === 1 ? "" : "s"} — see original chat]_`
          : "";
      return `${speaker}\n${m.content}${attachmentNote}`;
    })
    .join("\n\n---\n\n");

  const title =
    convRes.data.title.length > 100
      ? `${convRes.data.title.slice(0, 97)}…`
      : convRes.data.title;
  const content = [
    `Saved from AI Study Chat.`,
    ``,
    body,
  ].join("\n\n");

  const { data: noteRow, error: noteErr } = await supabase
    .from("notes")
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      subject_id: parsed.data.subjectId,
      title,
      content,
    })
    .select("id")
    .single();

  if (noteErr || !noteRow) {
    return err({ code: "DB", message: "Couldn't save the note." });
  }

  await logActivity({
    entityType: "note",
    entityId: noteRow.id,
    action: "created",
    title,
  });

  revalidatePath("/app/notes");
  revalidatePath("/app/workspace");

  return ok({ noteId: noteRow.id });
}
