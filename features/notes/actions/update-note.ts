"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { updateNoteSchema, type UpdateNoteInput } from "../schemas/note";

export async function updateNote(
  input: UpdateNoteInput,
  options?: { redirectTo?: string },
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check the note details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const scope = await getAcademicScope();
  if (!scope) {
    return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  }
  if (!scope.subjectIds.includes(parsed.data.subjectId)) {
    return err({
      code: "VALIDATION",
      message: "This subject isn't in your active list.",
      fieldErrors: { subjectId: ["Pick a subject from your profile"] },
    });
  }

  const supabase = await getSupabaseServer();

  const supabaseUser = await supabase.auth.getUser();
  const userId = supabaseUser.data.user?.id;
  if (!userId) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("notes")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      subject_id: parsed.data.subjectId,
      chapter_id: parsed.data.chapterId ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return err({ code: "DB", message: "Couldn't save your changes." });
  }
  if (!data) {
    return err({ code: "NOT_FOUND", message: "Note not found." });
  }

  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${parsed.data.id}`);

  if (options?.redirectTo) {
    redirect(options.redirectTo);
  }

  return ok({ id: data.id });
}
