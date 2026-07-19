"use server";

import { randomUUID } from "crypto";

import { getAcademicScope } from "@/lib/academic/scope";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { extForMime, isAllowedMime, STORAGE_BUCKET } from "../lib/mime";
import { beginUploadSchema, type BeginUploadInput } from "../schemas/file";
import type { StudyFileMime } from "../types";

/**
 * Reserves a `fileId` and `storagePath` for a new upload.
 *
 * Flow:
 *   1. Client calls this → gets `{ fileId, storagePath, bucket }`
 *   2. Client uploads directly to Storage via supabase.storage.from(bucket).upload(storagePath, file)
 *      (Storage RLS enforces the first path segment matches auth.uid())
 *   3. Client calls `completeUpload({ fileId, storagePath, subjectId, ... })`
 *
 * We generate the fileId server-side (UUIDv4) so clients can't try to guess
 * or reuse another user's slot.
 */
export async function beginUpload(
  input: BeginUploadInput,
): Promise<Result<{ fileId: string; storagePath: string; bucket: string }, ActionError>> {
  const parsed = beginUploadSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the file details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  if (!isAllowedMime(parsed.data.mimeType)) {
    return err({
      code: "VALIDATION",
      message: "Only PDF and image files (PNG, JPG) are supported for now.",
    });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const fileId = randomUUID();
  const ext = extForMime(parsed.data.mimeType as StudyFileMime);
  const storagePath = `${scope.userId}/${fileId}.${ext}`;

  return ok({ fileId, storagePath, bucket: STORAGE_BUCKET });
}
