"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { QuizWithQuestions, QuizQuestionType } from "../types";

export async function getQuiz(
  id: string,
): Promise<Result<QuizWithQuestions, ActionError>> {
  const supabase = await getSupabaseServer();

  const [quizRes, questionsRes, answersRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select(
        `
          id, user_id, board_id, class_id, medium_id, subject_id, topic,
          question_types, total_questions, correct_count, completed_at,
          created_at, updated_at,
          subject:subjects ( name )
        `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("id, quiz_id, ordinal, type, question, options, correct_answer, explanation")
      .eq("quiz_id", id)
      .order("ordinal"),
    supabase
      .from("quiz_answers")
      .select("id, quiz_id, question_id, user_answer, is_correct, self_marked_correct, answered_at")
      .eq("quiz_id", id),
  ]);

  if (quizRes.error) {
    return err({ code: "DB", message: "Couldn't load quiz." });
  }
  if (!quizRes.data) {
    return err({ code: "NOT_FOUND", message: "Quiz not found." });
  }

  const subject = Array.isArray(quizRes.data.subject)
    ? quizRes.data.subject[0]
    : quizRes.data.subject;

  const answersByQuestionId = Object.fromEntries(
    (answersRes.data ?? []).map((a) => [
      a.question_id,
      {
        id: a.id,
        quizId: a.quiz_id,
        questionId: a.question_id,
        userAnswer: a.user_answer,
        isCorrect: a.is_correct,
        selfMarkedCorrect: a.self_marked_correct,
        answeredAt: a.answered_at,
      },
    ]),
  );

  return ok({
    id: quizRes.data.id,
    userId: quizRes.data.user_id,
    boardId: quizRes.data.board_id,
    classId: quizRes.data.class_id,
    mediumId: quizRes.data.medium_id,
    subjectId: quizRes.data.subject_id,
    subjectName: subject?.name ?? "—",
    topic: quizRes.data.topic,
    questionTypes: quizRes.data.question_types as QuizQuestionType[],
    totalQuestions: quizRes.data.total_questions,
    correctCount: quizRes.data.correct_count,
    completedAt: quizRes.data.completed_at,
    createdAt: quizRes.data.created_at,
    updatedAt: quizRes.data.updated_at,
    questions: (questionsRes.data ?? []).map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      ordinal: q.ordinal,
      type: q.type as QuizQuestionType,
      question: q.question,
      options: (q.options as string[]) ?? [],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    })),
    answers: answersByQuestionId,
  });
}
