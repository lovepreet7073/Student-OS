"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { StudyPlanWithItems } from "../types";

export async function getPlan(
  id: string,
): Promise<Result<StudyPlanWithItems, ActionError>> {
  const supabase = await getSupabaseServer();

  const [planRes, itemsRes] = await Promise.all([
    supabase
      .from("study_plans")
      .select(
        `id, user_id, board_id, class_id, medium_id, title, goal,
         start_date, end_date, daily_hours, focus_subject_ids,
         is_active, created_at, updated_at`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("study_plan_items")
      .select(
        `id, plan_id, user_id, plan_date, ordinal, subject_id,
         subject_name, topic, duration_minutes, notes, completed_at, created_at`,
      )
      .eq("plan_id", id)
      .order("plan_date", { ascending: true })
      .order("ordinal", { ascending: true }),
  ]);

  if (planRes.error) return err({ code: "DB", message: "Couldn't load plan." });
  if (!planRes.data) return err({ code: "NOT_FOUND", message: "Plan not found." });

  return ok({
    id: planRes.data.id,
    userId: planRes.data.user_id,
    boardId: planRes.data.board_id,
    classId: planRes.data.class_id,
    mediumId: planRes.data.medium_id,
    title: planRes.data.title,
    goal: planRes.data.goal,
    startDate: planRes.data.start_date,
    endDate: planRes.data.end_date,
    dailyHours: planRes.data.daily_hours,
    focusSubjectIds: planRes.data.focus_subject_ids ?? [],
    isActive: planRes.data.is_active,
    createdAt: planRes.data.created_at,
    updatedAt: planRes.data.updated_at,
    items: (itemsRes.data ?? []).map((r) => ({
      id: r.id,
      planId: r.plan_id,
      userId: r.user_id,
      planDate: r.plan_date,
      ordinal: r.ordinal,
      subjectId: r.subject_id,
      subjectName: r.subject_name,
      topic: r.topic,
      durationMinutes: r.duration_minutes,
      notes: r.notes,
      completedAt: r.completed_at,
      createdAt: r.created_at,
    })),
  });
}
