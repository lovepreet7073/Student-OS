"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type {
  EvaluationGrade,
  EvaluationStatus,
  ExamType,
  TestEvaluationListItem,
} from "../types";

export async function listEvaluations(
  limit = 30,
): Promise<Result<TestEvaluationListItem[], ActionError>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("test_evaluations")
    .select(
      `id, title, exam_type, subject_id, status, ai_score, ai_percentage,
       ai_grade, max_marks, created_at,
       subject:subjects ( name )`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return err({ code: "DB", message: "Couldn't load evaluation history." });

  return ok(
    (data ?? []).map((row) => {
      const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
      return {
        id: row.id,
        title: row.title,
        examType: row.exam_type as ExamType,
        subjectId: row.subject_id,
        subjectName: subject?.name ?? "—",
        status: row.status as EvaluationStatus,
        aiScore: row.ai_score,
        aiPercentage: row.ai_percentage,
        aiGrade: (row.ai_grade as EvaluationGrade | null) ?? null,
        maxMarks: row.max_marks,
        createdAt: row.created_at,
      };
    }),
  );
}
