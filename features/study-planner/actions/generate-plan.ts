"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getStudentContext } from "@/lib/gemini/context";
import { buildStudyPlanPrompt } from "@/lib/gemini/prompts/study-plan";
import { AIStructuredError, generateStructured } from "@/lib/gemini/structured";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { addDays, daysBetween } from "../lib/dates";
import { generatePlanSchema, type GeneratePlanInput } from "../schemas/plan";
import { geminiStudyPlanResponseSchema } from "../schemas/gemini";

export async function generatePlan(
  input: GeneratePlanInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = generatePlanSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the plan settings.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const invalidFocus = parsed.data.focusSubjectIds.filter(
    (id) => !scope.subjectIds.includes(id),
  );
  if (invalidFocus.length > 0) {
    return err({
      code: "VALIDATION",
      message: "Focus subjects must come from your active list.",
      fieldErrors: { focusSubjectIds: ["Pick subjects from your profile"] },
    });
  }

  const ctx = await getStudentContext();
  if (!ctx) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const { data: subjectRows, error: subjErr } = await supabase
    .from("subjects")
    .select("id, name")
    .in("id", parsed.data.focusSubjectIds);
  if (subjErr || !subjectRows) {
    return err({ code: "DB", message: "Couldn't load subject details." });
  }
  const subjectNameById = new Map(subjectRows.map((r) => [r.id, r.name]));
  const focusSubjectNames = parsed.data.focusSubjectIds
    .map((id) => subjectNameById.get(id))
    .filter((n): n is string => Boolean(n));

  const daysCount = daysBetween(parsed.data.startDate, parsed.data.endDate);

  // ---- Call Gemini ----
  let aiResult;
  try {
    aiResult = await generateStructured({
      prompt: buildStudyPlanPrompt({
        ctx,
        focusSubjects: focusSubjectNames,
        goal: parsed.data.goal,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        daysCount,
        dailyHours: parsed.data.dailyHours,
      }),
      schema: geminiStudyPlanResponseSchema,
      maxRetries: 1,
    });
  } catch (e) {
    if (e instanceof AIStructuredError) {
      return err({
        code: "AI",
        message: "The AI couldn't generate a valid plan. Try a narrower window or clearer goal.",
      });
    }
    return err({
      code: "AI",
      message: "AI service is unavailable right now. Please try again.",
    });
  }

  // ---- Deactivate existing active plans, then insert new plan as active ----
  await supabase
    .from("study_plans")
    .update({ is_active: false })
    .eq("user_id", scope.userId)
    .eq("is_active", true);

  const { data: planRow, error: planErr } = await supabase
    .from("study_plans")
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      title: parsed.data.title,
      goal: parsed.data.goal || null,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      daily_hours: parsed.data.dailyHours,
      focus_subject_ids: parsed.data.focusSubjectIds,
      is_active: true,
      raw_gemini_response: aiResult.data,
    })
    .select("id")
    .single();

  if (planErr || !planRow) {
    return err({ code: "DB", message: "Couldn't save the plan. Try again." });
  }

  // Reverse-map AI's subject_name → subject_id where possible (nullable if the
  // AI drifted from our provided names — the item still persists with the name).
  const nameToId = new Map(subjectRows.map((r) => [r.name.toLowerCase(), r.id]));

  const itemRows = aiResult.data.days.flatMap((day, dayIdx) => {
    const planDate = addDays(parsed.data.startDate, day.day_offset ?? dayIdx);
    return day.sessions.map((session, i) => ({
      plan_id: planRow.id,
      user_id: scope.userId,
      plan_date: planDate,
      ordinal: i + 1,
      subject_id: nameToId.get(session.subject_name.toLowerCase()) ?? null,
      subject_name: session.subject_name,
      topic: session.topic,
      duration_minutes: session.duration_minutes,
      notes: session.notes || null,
    }));
  });

  if (itemRows.length > 0) {
    const { error: itemErr } = await supabase.from("study_plan_items").insert(itemRows);
    if (itemErr) {
      await supabase.from("study_plans").delete().eq("id", planRow.id);
      return err({ code: "DB", message: "Couldn't save plan sessions. Try again." });
    }
  }

  revalidatePath("/app/planner");
  revalidatePath("/app/dashboard");

  return ok({ id: planRow.id });
}
