"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { QuizListItem } from "../types";

export async function listQuizzes(
  limit = 30,
): Promise<Result<QuizListItem[], ActionError>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `
        id, topic, subject_id, total_questions, correct_count, completed_at, created_at,
        subject:subjects ( name )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return err({ code: "DB", message: "Couldn't load quiz history." });
  }

  return ok(
    (data ?? []).map((row) => {
      const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
      return {
        id: row.id,
        topic: row.topic,
        subjectId: row.subject_id,
        subjectName: subject?.name ?? "—",
        totalQuestions: row.total_questions,
        correctCount: row.correct_count,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      };
    }),
  );
}
