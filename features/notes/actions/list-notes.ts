"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { notesQuerySchema, type NotesQueryInput } from "../schemas/note";
import type { NotesListResult } from "../types";

/**
 * Lists the caller's notes, always constrained to their current academic scope
 * (board × class × medium × their active subjects).
 *
 * Server-side ILIKE search on title/content — will migrate to `to_tsvector`
 * (index is already provisioned) once note counts justify it.
 */
export async function listNotes(
  input: Partial<NotesQueryInput> = {},
): Promise<Result<NotesListResult, ActionError>> {
  const parsed = notesQuerySchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Invalid list parameters.",
    });
  }
  const { subjectId, chapterId, bookmarkedOnly, search, limit, offset } = parsed.data;

  const scope = await getAcademicScope();
  if (!scope) {
    return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  }
  if (scope.subjectIds.length === 0) {
    return ok({ items: [], total: 0 });
  }

  const supabase = await getSupabaseServer();

  let query = supabase
    .from("notes")
    .select(
      `
        id, user_id, board_id, class_id, medium_id, subject_id,
        title, content, is_bookmarked, created_at, updated_at,
        subject:subjects ( name, slug )
      `,
      { count: "exact" },
    )
    .eq("board_id", scope.boardId)
    .eq("class_id", scope.classId)
    .eq("medium_id", scope.mediumId)
    .in("subject_id", scope.subjectIds)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (subjectId) {
    if (!scope.subjectIds.includes(subjectId)) {
      // The caller asked for a subject outside their active set — return empty
      // rather than an error; keeps the UI resilient to stale filters.
      return ok({ items: [], total: 0 });
    }
    query = query.eq("subject_id", subjectId);
  }

  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }

  if (bookmarkedOnly) {
    query = query.eq("is_bookmarked", true);
  }

  if (search && search.length > 0) {
    const like = `%${search.replace(/[%_]/g, "\\$&")}%`;
    query = query.or(`title.ilike.${like},content.ilike.${like}`);
  }

  const { data, error, count } = await query;

  if (error) {
    return err({ code: "DB", message: "Couldn't load notes. Try again." });
  }

  const items = (data ?? []).map((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    return {
      id: row.id,
      userId: row.user_id,
      boardId: row.board_id,
      classId: row.class_id,
      mediumId: row.medium_id,
      subjectId: row.subject_id,
      chapterId: (row as { chapter_id?: string | null }).chapter_id ?? null,
      title: row.title,
      content: row.content,
      isBookmarked: row.is_bookmarked,
      visibility: "private" as const,
      shareToken: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      subjectName: subject?.name ?? "—",
      subjectSlug: subject?.slug ?? "",
    };
  });

  return ok({ items, total: count ?? items.length });
}
