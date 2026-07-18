"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({ id: z.string().uuid() });

export async function deleteTask(input: {
  id: string;
}): Promise<Result<null, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid task id." });

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("tasks").delete().eq("id", parsed.data.id);

  if (error) return err({ code: "DB", message: "Couldn't delete the task." });

  revalidatePath("/app/tasks");
  revalidatePath("/app/dashboard");

  return ok(null);
}
