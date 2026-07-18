"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { autoGrade } from "../lib/grading";
import { submitQuizSchema, type SubmitQuizInput } from "../schemas/quiz";
import type { QuizQuestionType } from "../types";

/**
 * Grades every MCQ / T/F / fill_blank on submit. Short-answer rows are
 * inserted with is_correct = null and will be marked by the student on the
 * results screen (self-mark honesty system for MVP).
 *
 * All-or-nothing per submit — you can't partial-submit. Retake = new quiz.
 */
export async function submitQuiz(
  input: SubmitQuizInput,
): Promise<Result<null, ActionError>> {
  const parsed = submitQuizSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Couldn't submit quiz answers." });
  }

  const supabase = await getSupabaseServer();

  const [quizRes, questionsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, user_id, completed_at, total_questions")
      .eq("id", parsed.data.quizId)
      .maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("id, type, correct_answer")
      .eq("quiz_id", parsed.data.quizId),
  ]);

  if (quizRes.error || !quizRes.data) {
    return err({ code: "NOT_FOUND", message: "Quiz not found." });
  }
  if (quizRes.data.completed_at) {
    return err({ code: "CONFLICT", message: "This quiz was already submitted." });
  }
  if (questionsRes.error || !questionsRes.data) {
    return err({ code: "DB", message: "Couldn't load quiz questions." });
  }

  const questionsById = new Map(
    questionsRes.data.map((q) => [
      q.id,
      { type: q.type as QuizQuestionType, correctAnswer: q.correct_answer },
    ]),
  );

  const rows = parsed.data.answers
    .filter((a) => questionsById.has(a.questionId))
    .map((a) => {
      const q = questionsById.get(a.questionId)!;
      const grade = autoGrade(
        { type: q.type, correctAnswer: q.correctAnswer },
        a.answer,
      );
      return {
        quiz_id: parsed.data.quizId,
        question_id: a.questionId,
        user_id: quizRes.data.user_id,
        user_answer: a.answer,
        is_correct: grade,
      };
    });

  const { error: insertErr } = await supabase.from("quiz_answers").insert(rows);
  if (insertErr) {
    return err({ code: "DB", message: "Couldn't save your answers." });
  }

  // Auto-graded correct count: excludes short-answer (null → not counted yet).
  const autoCorrect = rows.filter((r) => r.is_correct === true).length;

  const { error: updateErr } = await supabase
    .from("quizzes")
    .update({
      completed_at: new Date().toISOString(),
      correct_count: autoCorrect,
    })
    .eq("id", parsed.data.quizId);

  if (updateErr) {
    return err({ code: "DB", message: "Couldn't finalise the quiz." });
  }

  revalidatePath("/app/study");
  revalidatePath(`/app/study/${parsed.data.quizId}`);

  return ok(null);
}
