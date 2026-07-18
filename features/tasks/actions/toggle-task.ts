"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { toggleTaskSchema, type ToggleTaskInput } from "../schemas/task";

/**
 * Explicit boolean, not a toggle, so double-clicks can't race the server
 * into an inconsistent state.
 */
export async function toggleTask(
  input: ToggleTaskInput,
): Promise<Result<{ completedAt: string | null }, ActionError>> {
  const parsed = toggleTaskSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid task update." });
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed_at: parsed.data.done ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id)
    .select("completed_at")
    .maybeSingle();

  if (error) {
    return err({ code: "DB", message: "Couldn't update the task." });
  }
  if (!data) return err({ code: "NOT_FOUND", message: "Task not found." });

  revalidatePath("/app/tasks");
  revalidatePath("/app/dashboard");

  return ok({ completedAt: data.completed_at });
}
