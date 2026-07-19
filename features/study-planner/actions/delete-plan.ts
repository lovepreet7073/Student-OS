"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({ id: z.string().uuid() });

export async function deletePlan(
  input: { id: string },
  options?: { redirectTo?: string },
): Promise<Result<null, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid id." });

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("study_plans").delete().eq("id", parsed.data.id);

  if (error) return err({ code: "DB", message: "Couldn't delete the plan." });

  revalidatePath("/app/planner");
  revalidatePath("/app/dashboard");
  if (options?.redirectTo) redirect(options.redirectTo);
  return ok(null);
}
