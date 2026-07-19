"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { shareNoteSchema, type ShareNoteInput } from "../schemas/community";

/**
 * Copies a private note into the community as pending. The row is a
 * **snapshot** — future edits to the source note don't affect the community
 * copy. A note can be shared multiple times (each snapshot is independent),
 * so we don't prevent re-shares.
 */
export async function shareNote(
  input: ShareNoteInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = shareNoteSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid note." });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const noteRes = await supabase
    .from("notes")
    .select("id, user_id, board_id, class_id, medium_id, subject_id, title, content")
    .eq("id", parsed.data.noteId)
    .maybeSingle();

  if (noteRes.error || !noteRes.data) {
    return err({ code: "NOT_FOUND", message: "Note not found." });
  }
  if (noteRes.data.user_id !== user.id) {
    return err({ code: "FORBIDDEN", message: "You can only share your own notes." });
  }

  const displayName =
    (user.user_metadata as { display_name?: string } | null)?.display_name ??
    user.email?.split("@")[0] ??
    "Anonymous";

  const insertRes = await supabase
    .from("community_notes")
    .insert({
      source_note_id: noteRes.data.id,
      author_id: user.id,
      author_display_name: displayName,
      board_id: noteRes.data.board_id,
      class_id: noteRes.data.class_id,
      medium_id: noteRes.data.medium_id,
      subject_id: noteRes.data.subject_id,
      title: noteRes.data.title,
      content: noteRes.data.content,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data) {
    return err({ code: "DB", message: "Couldn't share the note. Try again." });
  }

  revalidatePath("/app/community");
  revalidatePath(`/app/notes/${noteRes.data.id}`);

  return ok({ id: insertRes.data.id });
}
