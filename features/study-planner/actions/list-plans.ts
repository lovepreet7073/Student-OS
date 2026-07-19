"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { StudyPlanListItem } from "../types";

export async function listPlans(
  limit = 20,
): Promise<Result<StudyPlanListItem[], ActionError>> {
  const supabase = await getSupabaseServer();

  const { data: plans, error: planErr } = await supabase
    .from("study_plans")
    .select("id, title, start_date, end_date, daily_hours, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (planErr) return err({ code: "DB", message: "Couldn't load plans." });
  if (!plans || plans.length === 0) return ok([]);

  const planIds = plans.map((p) => p.id);

  // Item counts + completed counts per plan — one query.
  const { data: items, error: itemsErr } = await supabase
    .from("study_plan_items")
    .select("plan_id, completed_at")
    .in("plan_id", planIds);

  if (itemsErr) return err({ code: "DB", message: "Couldn't load plan progress." });

  const totals = new Map<string, { total: number; done: number }>();
  for (const item of items ?? []) {
    const entry = totals.get(item.plan_id) ?? { total: 0, done: 0 };
    entry.total++;
    if (item.completed_at) entry.done++;
    totals.set(item.plan_id, entry);
  }

  return ok(
    plans.map((p) => {
      const counts = totals.get(p.id) ?? { total: 0, done: 0 };
      return {
        id: p.id,
        title: p.title,
        startDate: p.start_date,
        endDate: p.end_date,
        dailyHours: p.daily_hours,
        isActive: p.is_active,
        createdAt: p.created_at,
        totalItems: counts.total,
        completedItems: counts.done,
      };
    }),
  );
}
