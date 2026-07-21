"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, type ActionError, type Result } from "@/lib/result";

/**
 * Creates a fresh conversation seeded with the contents of a note, then
 * redirects to `/app/chat/{id}?auto=1` so the assistant auto-responds
 * to that opening message.
 *
 * Note ownership is checked implicitly via RLS on `notes` — the select
 * only returns rows the caller owns.
 */
export async function startChatFromNote(
  noteId: string,
): Promise<Result<never, ActionError>> {
  if (!noteId) return err({ code: "VALIDATION", message: "Missing note id." });

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const { data: note, error: noteErr } = await supabase
    .from("notes")
    .select("title, content, subject_id")
    .eq("id", noteId)
    .maybeSingle();

  if (noteErr) return err({ code: "DB", message: "Couldn't load the note." });
  if (!note) return err({ code: "NOT_FOUND", message: "Note not found." });

  const subjectId =
    note.subject_id && profile.subjects.some((s) => s.id === note.subject_id)
      ? note.subject_id
      : null;

  const title =
    note.title.length > 40
      ? `${note.title.slice(0, 37)}…`
      : note.title || "Note discussion";

  const { data: conv, error: convErr } = await supabase
    .from("chat_conversations")
    .insert({
      user_id: profile.userId,
      subject_id: subjectId,
      title,
    })
    .select("id")
    .single();

  if (convErr || !conv) {
    return err({ code: "DB", message: "Couldn't start a chat." });
  }

  const openingMessage = [
    `I want to discuss this note titled "${note.title}":`,
    ``,
    note.content.slice(0, 3500),
    ``,
    `Explain the key ideas, then ask me a question to check I've understood.`,
  ].join("\n");

  const { error: msgErr } = await supabase.from("chat_messages").insert({
    conversation_id: conv.id,
    user_id: profile.userId,
    role: "user",
    content: openingMessage,
  });

  if (msgErr) {
    await supabase.from("chat_conversations").delete().eq("id", conv.id);
    return err({ code: "DB", message: "Couldn't seed the chat." });
  }

  revalidatePath("/app/chat");
  redirect(`/app/chat/${conv.id}?auto=1`);
}
