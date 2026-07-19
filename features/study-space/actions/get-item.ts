"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

import type { StudyFile, StudyFileMime } from "../types";

export async function getFileMetadata(
  id: string,
): Promise<Result<StudyFile, ActionError>> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't load file." });
  if (!data) return err({ code: "NOT_FOUND", message: "File not found." });

  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject;
  const chapter = Array.isArray(data.chapter) ? data.chapter[0] : data.chapter;

  await logActivity({
    entityType: "file",
    entityId: data.id,
    action: "opened",
    title: data.file_name,
  });

  return ok({
    id: data.id,
    userId: data.user_id,
    boardId: data.board_id,
    classId: data.class_id,
    mediumId: data.medium_id,
    subjectId: data.subject_id,
    subjectName: subject?.name ?? "—",
    chapterId: data.chapter_id,
    chapterName: chapter?.name ?? null,
    fileName: data.file_name,
    mimeType: data.mime_type as StudyFileMime,
    sizeBytes: data.size_bytes,
    storagePath: data.storage_path,
    description: data.description,
    isBookmarked: data.is_bookmarked,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}
