"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

import { todayIsoDate } from "../lib/dates";
import type { StudyPlanItem } from "../types";

/**
 * Dashboard widget helper: today's sessions from the currently-active plan.
 * Returns an empty array (not null) when there's no active plan or no
 * sessions for today — the widget renders an empty state.
 */
export async function getActivePlanToday(): Promise<{
  planId: string | null;
  planTitle: string | null;
  items: StudyPlanItem[];
}> {
  const supabase = await getSupabaseServer();

  const { data: plan } = await supabase
    .from("study_plans")
    .select("id, title")
    .eq("is_active", true)
    .maybeSingle();

  if (!plan) return { planId: null, planTitle: null, items: [] };

  const today = todayIsoDate();
  const { data: items } = await supabase
    .from("study_plan_items")
    .select(
      `id, plan_id, user_id, plan_date, ordinal, subject_id, subject_name,
       topic, duration_minutes, notes, completed_at, created_at`,
    )
    .eq("plan_id", plan.id)
    .eq("plan_date", today)
    .order("ordinal", { ascending: true });

  return {
    planId: plan.id,
    planTitle: plan.title,
    items: (items ?? []).map((r) => ({
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
  };
}
