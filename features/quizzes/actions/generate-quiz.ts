"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getStudentContext } from "@/lib/gemini/context";
import { buildQuizPrompt } from "@/lib/gemini/prompts/quiz";
import { generateStructured, AIStructuredError } from "@/lib/gemini/structured";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  generateQuizSchema,
  type GenerateQuizInput,
} from "../schemas/quiz";
import { geminiQuizResponseSchema } from "../schemas/gemini";

/**
 * Full generate flow:
 *   1. Validate input
 *   2. Confirm subject belongs to student's active academic scope
 *   3. Fetch student context (board/class/medium human names) for prompt
 *   4. Ask Gemini for JSON, retry once on parse/validation failure
 *   5. Insert quiz row + question rows atomically-ish (see caveat below)
 *
 * Caveat: Supabase's PostgREST doesn't expose transactions from the client
 * SDK, so we insert the quiz then the questions. If the second insert fails
 * we clean up by deleting the quiz — best-effort; a rare orphaned quiz row
 * is a bug on our side but never leaks user data.
 */
export async function generateQuiz(
  input: GenerateQuizInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = generateQuizSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the quiz settings.",
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

  const ctx = await getStudentContext();
  if (!ctx) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const { data: subjectRow, error: subjectErr } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", parsed.data.subjectId)
    .single();
  if (subjectErr || !subjectRow) {
    return err({ code: "NOT_FOUND", message: "Subject not found." });
  }

  // ---- Call Gemini ----
  let aiResult;
  try {
    aiResult = await generateStructured({
      prompt: buildQuizPrompt({
        ctx,
        subjectName: subjectRow.name,
        topic: parsed.data.topic,
        questionCount: parsed.data.questionCount,
        questionTypes: parsed.data.questionTypes,
        mode: parsed.data.mode,
      }),
      schema: geminiQuizResponseSchema,
      maxRetries: 1,
    });
  } catch (e) {
    if (e instanceof AIStructuredError) {
      return err({
        code: "AI",
        message: "The AI couldn't generate a valid quiz. Try a more specific topic.",
      });
    }
    return err({
      code: "AI",
      message: "AI service is unavailable right now. Please try again.",
    });
  }

  // ---- Persist ----
  const { data: quizRow, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      subject_id: parsed.data.subjectId,
      topic: parsed.data.topic,
      question_types: parsed.data.questionTypes,
      total_questions: aiResult.data.questions.length,
      raw_gemini_response: aiResult.data,
    })
    .select("id")
    .single();

  if (quizErr || !quizRow) {
    return err({ code: "DB", message: "Couldn't save the quiz. Try again." });
  }

  const questionRows = aiResult.data.questions.map((q, i) => ({
    quiz_id: quizRow.id,
    user_id: scope.userId,
    ordinal: i + 1,
    type: q.type,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
  }));

  const { error: qErr } = await supabase.from("quiz_questions").insert(questionRows);
  if (qErr) {
    // Best-effort cleanup — if this fails too, we've got an orphan quiz row.
    await supabase.from("quizzes").delete().eq("id", quizRow.id);
    return err({ code: "DB", message: "Couldn't save quiz questions. Try again." });
  }

  revalidatePath("/app/study");

  return ok({ id: quizRow.id });
}
