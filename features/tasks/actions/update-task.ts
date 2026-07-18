"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { updateTaskSchema, type UpdateTaskInput } from "../schemas/task";

export async function updateTask(
  input: UpdateTaskInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the task details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  if (parsed.data.subjectId && !scope.subjectIds.includes(parsed.data.subjectId)) {
    return err({
      code: "VALIDATION",
      message: "Pick a subject from your profile.",
      fieldErrors: { subjectId: ["Not in your active subjects"] },
    });
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      subject_id: parsed.data.subjectId ?? null,
      due_date: parsed.data.dueDate ?? null,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't save your changes." });
  if (!data) return err({ code: "NOT_FOUND", message: "Task not found." });

  revalidatePath("/app/tasks");
  revalidatePath("/app/dashboard");

  return ok({ id: data.id });
}
