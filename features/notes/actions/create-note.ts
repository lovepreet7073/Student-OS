"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

import { createNoteSchema, type CreateNoteInput } from "../schemas/note";

export async function createNote(
  input: CreateNoteInput,
  options?: { redirectTo?: string },
): Promise<Result<{ id: string }, ActionError>> {
  const parsed = createNoteSchema.safeParse(input);
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

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: scope.userId,
      board_id: scope.boardId,
      class_id: scope.classId,
      medium_id: scope.mediumId,
      subject_id: parsed.data.subjectId,
      chapter_id: parsed.data.chapterId ?? null,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .select("id")
    .single();

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't save your note. Try again." });
  }

  await logActivity({
    entityType: "note",
    entityId: data.id,
    action: "created",
    title: parsed.data.title,
  });

  revalidatePath("/app/notes");
  revalidatePath("/app/workspace");

  if (options?.redirectTo) {
    redirect(options.redirectTo);
  }

  return ok({ id: data.id });
}
