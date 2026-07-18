"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { NoteListItem } from "../types";

export async function getNote(
  id: string,
): Promise<Result<NoteListItem, ActionError>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("notes")
    .select(
      `
        id, user_id, board_id, class_id, medium_id, subject_id,
        title, content, is_bookmarked, created_at, updated_at,
        subject:subjects ( name, slug )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return err({ code: "DB", message: "Couldn't load the note." });
  }
  if (!data) {
    return err({ code: "NOT_FOUND", message: "Note not found." });
  }

  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject;

  return ok({
    id: data.id,
    userId: data.user_id,
    boardId: data.board_id,
    classId: data.class_id,
    mediumId: data.medium_id,
    subjectId: data.subject_id,
    title: data.title,
    content: data.content,
    isBookmarked: data.is_bookmarked,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    subjectName: subject?.name ?? "—",
    subjectSlug: subject?.slug ?? "",
  });
}
