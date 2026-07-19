"use server";

import { revalidatePath } from "next/cache";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  createChapterSchema,
  type CreateChapterInput,
} from "../schemas/chapter";

export async function createChapter(
  input: CreateChapterInput,
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = createChapterSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the chapter details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  if (!scope.subjectIds.includes(parsed.data.subjectId)) {
    return err({
      code: "VALIDATION",
      message: "Pick a subject from your profile.",
      fieldErrors: { subjectId: ["Not in your active subjects"] },
    });
  }

  const supabase = await getSupabaseServer();

  // sort_order = current max + 1 (small table, cheap subquery)
  const { data: maxRow } = await supabase
    .from("chapters")
    .select("sort_order")
    .eq("user_id", scope.userId)
    .eq("subject_id", parsed.data.subjectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      user_id: scope.userId,
      subject_id: parsed.data.subjectId,
      name: parsed.data.name,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't create the chapter." });
  }

  revalidatePath("/app/library");
  return ok({ id: data.id });
}
