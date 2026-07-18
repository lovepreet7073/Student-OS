"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { selfMarkSchema, type SelfMarkInput } from "../schemas/quiz";

/**
 * Student self-marks a short-answer question after seeing the reference
 * answer. This adjusts the quiz's `correct_count` on the fly so the score
 * updates in place.
 */
export async function selfMark(
  input: SelfMarkInput,
): Promise<Result<{ correctCount: number }, ActionError>> {
  const parsed = selfMarkSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid self-mark." });
  }

  const supabase = await getSupabaseServer();

  const { data: answerRow, error: fetchErr } = await supabase
    .from("quiz_answers")
    .select("id, quiz_id, self_marked_correct")
    .eq("id", parsed.data.answerId)
    .maybeSingle();

  if (fetchErr || !answerRow) {
    return err({ code: "NOT_FOUND", message: "Answer not found." });
  }

  const { error: updateAnswerErr } = await supabase
    .from("quiz_answers")
    .update({ self_marked_correct: parsed.data.correct })
    .eq("id", parsed.data.answerId);

  if (updateAnswerErr) {
    return err({ code: "DB", message: "Couldn't save your self-mark." });
  }

  // Recompute correct_count for the whole quiz — cheap for <= 25 rows.
  const { data: rows } = await supabase
    .from("quiz_answers")
    .select("is_correct, self_marked_correct")
    .eq("quiz_id", answerRow.quiz_id);

  const correctCount = (rows ?? []).filter(
    (r) => r.is_correct === true || r.self_marked_correct === true,
  ).length;

  await supabase
    .from("quizzes")
    .update({ correct_count: correctCount })
    .eq("id", answerRow.quiz_id);

  revalidatePath(`/app/study/${answerRow.quiz_id}`);

  return ok({ correctCount });
}
