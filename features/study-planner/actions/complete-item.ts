"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { completeItemSchema, type CompleteItemInput } from "../schemas/plan";

export async function completeItem(
  input: CompleteItemInput,
): Promise<Result<{ completedAt: string | null }, ActionError>> {
  const parsed = completeItemSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid update." });
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("study_plan_items")
    .update({
      completed_at: parsed.data.done ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.itemId)
    .select("completed_at, plan_id")
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't update the session." });
  if (!data) return err({ code: "NOT_FOUND", message: "Session not found." });

  revalidatePath("/app/planner");
  revalidatePath(`/app/planner/${data.plan_id}`);
  revalidatePath("/app/dashboard");

  return ok({ completedAt: data.completed_at });
}
