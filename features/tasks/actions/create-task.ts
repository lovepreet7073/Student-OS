"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

import { createTaskSchema, type CreateTaskInput } from "../schemas/task";

export async function createTask(
  input: CreateTaskInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = createTaskSchema.safeParse(input);
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
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      subject_id: parsed.data.subjectId ?? null,
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      due_date: parsed.data.dueDate ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't save your task. Try again." });
  }

  await logActivity({
    entityType: "task",
    entityId: data.id,
    action: "created",
    title: parsed.data.title,
  });

  revalidatePath("/app/tasks");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/workspace");

  return ok({ id: data.id });
}
