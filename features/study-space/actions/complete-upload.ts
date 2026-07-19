"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

import { STORAGE_BUCKET, isAllowedMime } from "../lib/mime";
import {
  completeUploadSchema,
  type CompleteUploadInput,
} from "../schemas/file";

/**
 * Called after the client successfully uploads the raw bytes to Storage.
 * Inserts the DB row with all metadata.
 *
 * If this fails, the client should call `supabase.storage.from(bucket).remove([storagePath])`
 * to avoid orphans (best-effort). A nightly cleanup job for orphans is
 * documented but not built.
 */
export async function completeUpload(
  input: CompleteUploadInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = completeUploadSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Missing upload details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  if (!isAllowedMime(parsed.data.mimeType)) {
    return err({ code: "VALIDATION", message: "Unsupported file type." });
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

  // Storage path must live under the user's own folder — belt-and-braces
  // check on top of the RLS policy on storage.objects.
  const expectedPrefix = `${scope.userId}/`;
  if (!parsed.data.storagePath.startsWith(expectedPrefix)) {
    return err({ code: "FORBIDDEN", message: "Invalid storage path." });
  }

  const supabase = await getSupabaseServer();

  // If chapterId was supplied, confirm it belongs to the same subject + user.
  if (parsed.data.chapterId) {
    const { data: chapter, error: chapterErr } = await supabase
      .from("chapters")
      .select("id, subject_id, user_id")
      .eq("id", parsed.data.chapterId)
      .maybeSingle();

    if (chapterErr || !chapter) {
      return err({ code: "NOT_FOUND", message: "Chapter not found." });
    }
    if (chapter.subject_id !== parsed.data.subjectId) {
      return err({
        code: "VALIDATION",
        message: "Chapter belongs to a different subject.",
      });
    }
  }

  const { data, error } = await supabase
    .from("study_files")
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      subject_id: parsed.data.subjectId,
      chapter_id: parsed.data.chapterId ?? null,
      file_name: parsed.data.fileName,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      storage_path: parsed.data.storagePath,
      description: parsed.data.description ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Best-effort orphan cleanup: try to delete the Storage object.
    await supabase.storage.from(STORAGE_BUCKET).remove([parsed.data.storagePath]);
    return err({
      code: "DB",
      message: "Couldn't save file metadata. Try uploading again.",
    });
  }

  await logActivity({
    entityType: "file",
    entityId: data.id,
    action: "uploaded",
    title: parsed.data.fileName,
  });

  revalidatePath("/app/library");
  revalidatePath("/app/workspace");
  return ok({ id: data.id });
}
