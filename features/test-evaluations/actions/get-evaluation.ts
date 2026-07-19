"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type {
  EvaluationAnswer,
  EvaluationGrade,
  EvaluationStatus,
  ExamType,
  TestEvaluationWithPages,
} from "../types";

export async function getEvaluation(
  id: string,
): Promise<Result<TestEvaluationWithPages, ActionError>> {
  const supabase = await getSupabaseServer();

  const [evalRes, pagesRes] = await Promise.all([
    supabase
      .from("test_evaluations")
      .select(
        `id, user_id, board_id, class_id, medium_id, subject_id, title, exam_type,
         max_marks, topics, status, ai_score, ai_percentage, ai_grade, ai_summary,
         answers, recommended_topics, error_message, evaluated_at,
         created_at, updated_at,
         subject:subjects ( name )`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("test_evaluation_pages")
      .select("id, evaluation_id, page_number, storage_path, mime_type, size_bytes, created_at")
      .eq("evaluation_id", id)
      .order("page_number", { ascending: true }),
  ]);

  if (evalRes.error) return err({ code: "DB", message: "Couldn't load evaluation." });
  if (!evalRes.data) return err({ code: "NOT_FOUND", message: "Evaluation not found." });

  const subject = Array.isArray(evalRes.data.subject) ? evalRes.data.subject[0] : evalRes.data.subject;

  return ok({
    id: evalRes.data.id,
    userId: evalRes.data.user_id,
    boardId: evalRes.data.board_id,
    classId: evalRes.data.class_id,
    mediumId: evalRes.data.medium_id,
    subjectId: evalRes.data.subject_id,
    subjectName: subject?.name ?? "—",
    title: evalRes.data.title,
    examType: evalRes.data.exam_type as ExamType,
    maxMarks: evalRes.data.max_marks,
    topics: evalRes.data.topics,
    status: evalRes.data.status as EvaluationStatus,
    aiScore: evalRes.data.ai_score,
    aiPercentage: evalRes.data.ai_percentage,
    aiGrade: (evalRes.data.ai_grade as EvaluationGrade | null) ?? null,
    aiSummary: evalRes.data.ai_summary,
    answers: (evalRes.data.answers as EvaluationAnswer[] | null) ?? null,
    recommendedTopics: (evalRes.data.recommended_topics as string[] | null) ?? null,
    errorMessage: evalRes.data.error_message,
    evaluatedAt: evalRes.data.evaluated_at,
    createdAt: evalRes.data.created_at,
    updatedAt: evalRes.data.updated_at,
    pages: (pagesRes.data ?? []).map((p) => ({
      id: p.id,
      evaluationId: p.evaluation_id,
      pageNumber: p.page_number,
      storagePath: p.storage_path,
      mimeType: p.mime_type,
      sizeBytes: p.size_bytes,
      createdAt: p.created_at,
    })),
  });
}
