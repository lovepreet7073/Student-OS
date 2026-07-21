"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

const inputSchema = z.object({
  messageId: z.string().uuid(),
  subjectId: z.string().uuid("Choose a subject"),
});

export type SaveMessageAsNoteInput = z.infer<typeof inputSchema>;

/**
 * Copies an assistant chat reply into the notes library. Title is
 * derived from the parent conversation; content is the message body
 * verbatim, prefixed with a small provenance line so the student
 * remembers where it came from.
 *
 * Only `role = 'assistant'` messages can be saved — saving your own
 * question as a note doesn't help anyone.
 */
export async function saveMessageAsNote(
  input: SaveMessageAsNoteInput,
): Promise<Result<{ noteId: string }, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Couldn't save this reply.",
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

  const { data: msg, error: msgErr } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, role, content")
    .eq("id", parsed.data.messageId)
    .maybeSingle();

  if (msgErr) return err({ code: "DB", message: "Couldn't load the message." });
  if (!msg) return err({ code: "NOT_FOUND", message: "Message not found." });
  if (msg.role !== "assistant") {
    return err({
      code: "VALIDATION",
      message: "Only AI replies can be saved as notes.",
    });
  }

  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("title")
    .eq("id", msg.conversation_id)
    .maybeSingle();

  const rawTitle = conv?.title ?? "AI reply";
  const title = rawTitle.length > 100 ? `${rawTitle.slice(0, 97)}…` : rawTitle;
  const content = `From your AI Study Chat:\n\n${msg.content}`;

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
