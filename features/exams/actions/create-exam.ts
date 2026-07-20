"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { createExamSchema, type CreateExamInput } from "../schemas";

export async function createExam(
  input: CreateExamInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = createExamSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the exam details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("exam_dates")
    .insert({
      user_id: user.id,
      subject_id: parsed.data.subjectId ?? null,
      name: parsed.data.name,
      exam_date: parsed.data.examDate,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't save the exam. Try again." });
  }

  revalidatePath("/app/dashboard");
  revalidatePath("/app/workspace");
  return ok({ id: data.id });
}
