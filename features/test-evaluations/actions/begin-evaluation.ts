"use server";

import { randomUUID } from "crypto";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  beginEvaluationSchema,
  type BeginEvaluationInput,
} from "../schemas/evaluation";
import type { BeginEvaluationOutput } from "../types";

const BUCKET = "test-answers";

/**
 * Reserves an evaluation row + storage paths for every page.
 *
 * Flow:
 *   1. Client calls this → { evaluationId, bucket, pages: [{ pageNumber, storagePath }] }
 *   2. Client uploads each page via supabase.storage.upload(...)
 *   3. Client calls `submitForEvaluation({ evaluationId })` → server invokes Gemini
 */
export async function beginEvaluation(
  input: BeginEvaluationInput,
): Promise<Result<BeginEvaluationOutput, ActionError>> {
  const parsed = beginEvaluationSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the test details.",
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

  const evaluationId = randomUUID();

  const { error: evalErr } = await supabase.from("test_evaluations").insert({
    id: evaluationId,
    user_id: scope.userId,
    board_id: scope.boardId,
    class_id: scope.classId,
    medium_id: scope.mediumId,
    subject_id: parsed.data.subjectId,
    title: parsed.data.title,
    exam_type: parsed.data.examType,
    max_marks: parsed.data.maxMarks,
    topics: parsed.data.topics || null,
    status: "pending",
  });

  if (evalErr) {
    return err({ code: "DB", message: "Couldn't create the evaluation. Try again." });
  }

  // Reserve one storage path per page.
  const pageRows = parsed.data.pages.map((p) => {
    const ext = mimeToExt(p.mimeType);
    const storagePath = `${scope.userId}/eval-${evaluationId}/page-${p.pageNumber}.${ext}`;
    return {
      evaluation_id: evaluationId,
      user_id: scope.userId,
      page_number: p.pageNumber,
      storage_path: storagePath,
      mime_type: p.mimeType,
      size_bytes: p.sizeBytes,
    };
  });

  const { error: pagesErr } = await supabase
    .from("test_evaluation_pages")
    .insert(pageRows);

  if (pagesErr) {
    await supabase.from("test_evaluations").delete().eq("id", evaluationId);
    return err({ code: "DB", message: "Couldn't reserve page slots. Try again." });
  }

  return ok({
    evaluationId,
    bucket: BUCKET,
    pages: pageRows.map((r) => ({
      pageNumber: r.page_number,
      storagePath: r.storage_path,
    })),
  });
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "application/pdf": return "pdf";
    case "image/png":       return "png";
    case "image/jpeg":      return "jpg";
    default:                return "bin";
  }
}
