"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { listLibrarySchema, type ListLibraryInput } from "../schemas/file";
import type { StudyFile, StudyFileMime } from "../types";

export async function listLibraryItems(
  input: Partial<ListLibraryInput> = {},
): Promise<Result<StudyFile[], ActionError>> {
  const parsed = listLibrarySchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid list parameters." });
  }
  const { subjectId, chapterId, bookmarkedOnly, search, limit } = parsed.data;

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (scope.subjectIds.length === 0) return ok([]);

  const supabase = await getSupabaseServer();

  let query = supabase
    .from("study_files")
    .select(
      `
        id, user_id, board_id, class_id, medium_id, subject_id, chapter_id,
        file_name, mime_type, size_bytes, storage_path, description,
        is_bookmarked, created_at, updated_at,
        subject:subjects ( name ),
        chapter:chapters ( name )
      `,
    )
    .eq("user_id", scope.userId)
    .eq("board_id", scope.boardId)
    .eq("class_id", scope.classId)
    .eq("medium_id", scope.mediumId)
    .in("subject_id", scope.subjectIds)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (subjectId) {
    if (!scope.subjectIds.includes(subjectId)) return ok([]);
    query = query.eq("subject_id", subjectId);
  }
  if (chapterId) query = query.eq("chapter_id", chapterId);
  if (bookmarkedOnly) query = query.eq("is_bookmarked", true);

  if (search && search.length > 0) {
    const like = `%${search.replace(/[%_]/g, "\\$&")}%`;
    query = query.or(`file_name.ilike.${like},description.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) return err({ code: "DB", message: "Couldn't load your files." });

  return ok(
    (data ?? []).map((row) => {
      const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
      const chapter = Array.isArray(row.chapter) ? row.chapter[0] : row.chapter;
      return {
        id: row.id,
        userId: row.user_id,
        boardId: row.board_id,
        classId: row.class_id,
        mediumId: row.medium_id,
        subjectId: row.subject_id,
        subjectName: subject?.name ?? "—",
        chapterId: row.chapter_id,
        chapterName: chapter?.name ?? null,
        fileName: row.file_name,
        mimeType: row.mime_type as StudyFileMime,
        sizeBytes: row.size_bytes,
        storagePath: row.storage_path,
        description: row.description,
        isBookmarked: row.is_bookmarked,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  );
}
