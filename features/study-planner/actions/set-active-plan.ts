"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { setActivePlanSchema } from "../schemas/plan";

/**
 * Only one active plan per user at a time (enforced by a partial unique index
 * on `study_plans(user_id) WHERE is_active = true`). Flip old active → false,
 * flip new plan → true, in that order.
 */
export async function setActivePlan(input: {
  planId: string;
}): Promise<Result<null, ActionError>> {
  const parsed = setActivePlanSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid id." });

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();

  const { error: deactivateErr } = await supabase
    .from("study_plans")
    .update({ is_active: false })
    .eq("user_id", scope.userId)
    .eq("is_active", true);
  if (deactivateErr) {
    return err({ code: "DB", message: "Couldn't switch active plan." });
  }

  const { error: activateErr } = await supabase
    .from("study_plans")
    .update({ is_active: true })
    .eq("id", parsed.data.planId);
  if (activateErr) {
    return err({ code: "DB", message: "Couldn't activate this plan." });
  }

  revalidatePath("/app/planner");
  revalidatePath("/app/dashboard");
  return ok(null);
}
