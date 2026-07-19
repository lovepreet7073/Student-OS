"use server";

import { revalidatePath } from "next/cache";

import { getStudentContext } from "@/lib/gemini/context";
import { buildTestEvaluationPrompt } from "@/lib/gemini/prompts/test-evaluation";
import {
  AIStructuredError,
  generateStructured,
  type StructuredImage,
} from "@/lib/gemini/structured";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { gradeForPercentage } from "../lib/grading";
import { submitForEvaluationSchema } from "../schemas/evaluation";
import { geminiTestEvaluationResponseSchema } from "../schemas/gemini";
import type { ExamType } from "../types";

const BUCKET = "test-answers";
const MAX_INLINE_TOTAL_BYTES = 18 * 1024 * 1024;

/**
 * Kicks off Gemini Vision evaluation. Blocking — the caller waits.
 *
 * On Vercel Free (10s timeout) large tests may exceed the limit; use Pro
 * (60s) or self-host for reliability. Local dev has no timeout.
 *
 * Retryable: on failure, status flips to 'failed' with error_message set;
 * client can call this action again to retry.
 */
export async function submitForEvaluation(
  input: { evaluationId: string },
): Promise<Result<null, ActionError>> {
  const parsed = submitForEvaluationSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid evaluation id." });

  const supabase = await getSupabaseServer();

  // Fetch evaluation + pages + subject name in parallel.
  const [evalRes, pagesRes] = await Promise.all([
    supabase
      .from("test_evaluations")
      .select("id, user_id, title, exam_type, max_marks, topics, status, subject:subjects(name)")
      .eq("id", parsed.data.evaluationId)
      .maybeSingle(),
    supabase
      .from("test_evaluation_pages")
      .select("page_number, storage_path, mime_type, size_bytes")
      .eq("evaluation_id", parsed.data.evaluationId)
      .order("page_number", { ascending: true }),
  ]);

  if (evalRes.error || !evalRes.data) {
    return err({ code: "NOT_FOUND", message: "Evaluation not found." });
  }
  if (evalRes.data.status === "completed") {
    return err({ code: "CONFLICT", message: "This test was already evaluated." });
  }
  if (evalRes.data.status === "evaluating") {
    return err({ code: "CONFLICT", message: "Evaluation is already in progress." });
  }
  if (pagesRes.error || !pagesRes.data || pagesRes.data.length === 0) {
    await markFailed(supabase, parsed.data.evaluationId, "No pages found for this evaluation.");
    return err({ code: "VALIDATION", message: "No pages found for this evaluation." });
  }

  const totalBytes = pagesRes.data.reduce((sum, p) => sum + p.size_bytes, 0);
  if (totalBytes > MAX_INLINE_TOTAL_BYTES) {
    await markFailed(
      supabase,
      parsed.data.evaluationId,
      "Uploaded pages exceed the AI inline size limit (18 MB total).",
    );
    return err({
      code: "VALIDATION",
      message: "Uploaded pages are too large in total (max ~18 MB combined). Compress or split.",
    });
  }

  const subject = Array.isArray(evalRes.data.subject) ? evalRes.data.subject[0] : evalRes.data.subject;

  // Mark evaluating + clear any prior failure.
  await supabase
    .from("test_evaluations")
    .update({ status: "evaluating", error_message: null })
    .eq("id", parsed.data.evaluationId);

  revalidatePath(`/app/tests/${parsed.data.evaluationId}`);

  // Download each page as base64 (in parallel).
  const images = await downloadPagesAsInline(supabase, pagesRes.data);
  if (!images.ok) {
    await markFailed(supabase, parsed.data.evaluationId, images.error);
    return err({ code: "DB", message: images.error });
  }

  const ctx = await getStudentContext();
  if (!ctx) {
    await markFailed(supabase, parsed.data.evaluationId, "Student context missing.");
    return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  }

  // Call Gemini Vision.
  let aiResult;
  try {
    aiResult = await generateStructured({
      prompt: buildTestEvaluationPrompt({
        ctx,
        subjectName: subject?.name ?? "your subject",
        examType: evalRes.data.exam_type as ExamType,
        title: evalRes.data.title,
        topics: evalRes.data.topics ?? "",
        maxMarks: evalRes.data.max_marks,
        pageCount: pagesRes.data.length,
      }),
      images: images.data,
      schema: geminiTestEvaluationResponseSchema,
      maxRetries: 1,
      model: "gemini-1.5-flash",
    });
  } catch (e) {
    const message =
      e instanceof AIStructuredError
        ? "The AI couldn't produce a valid report. Try clearer photos or fewer pages."
        : "AI service is unavailable right now.";
    await markFailed(supabase, parsed.data.evaluationId, message);
    return err({ code: "AI", message });
  }

  // Clamp score to max_marks, recompute percentage/grade from arithmetic
  // (never trust the model's arithmetic when we can verify it).
  const clampedScore = Math.max(0, Math.min(aiResult.data.score, evalRes.data.max_marks));
  const percentage = Math.round((clampedScore / evalRes.data.max_marks) * 1000) / 10;
  const grade = gradeForPercentage(percentage);

  const { error: updateErr } = await supabase
    .from("test_evaluations")
    .update({
      status: "completed",
      ai_score: clampedScore,
      ai_percentage: percentage,
      ai_grade: grade,
      ai_summary: aiResult.data.overall_summary,
      answers: aiResult.data.answers,
      recommended_topics: aiResult.data.recommended_topics,
      raw_gemini_response: aiResult.data,
      evaluated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", parsed.data.evaluationId);

  if (updateErr) {
    await markFailed(supabase, parsed.data.evaluationId, "Couldn't save the report.");
    return err({ code: "DB", message: "Couldn't save the report." });
  }

  revalidatePath("/app/tests");
  revalidatePath(`/app/tests/${parsed.data.evaluationId}`);
  return ok(null);
}

async function markFailed(supabase: Awaited<ReturnType<typeof getSupabaseServer>>, id: string, msg: string) {
  await supabase
    .from("test_evaluations")
    .update({ status: "failed", error_message: msg })
    .eq("id", id);
  revalidatePath(`/app/tests/${id}`);
}

async function downloadPagesAsInline(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  pages: { storage_path: string; mime_type: string }[],
): Promise<{ ok: true; data: StructuredImage[] } | { ok: false; error: string }> {
  try {
    const settled = await Promise.all(
      pages.map(async (p) => {
        const { data: blob, error } = await supabase.storage.from(BUCKET).download(p.storage_path);
        if (error || !blob) throw new Error(`Missing page ${p.storage_path}`);
        const buf = Buffer.from(await blob.arrayBuffer());
        return { mimeType: p.mime_type, data: buf.toString("base64") };
      }),
    );
    return { ok: true, data: settled };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't fetch uploaded pages.",
    };
  }
}
