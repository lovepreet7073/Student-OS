"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export async function deleteExam(id: string): Promise<Result<null, ActionError>> {
  if (!id) return err({ code: "VALIDATION", message: "Missing id." });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  // Explicit ownership + row-count check — same pattern as deleteNote.
  const { data, error } = await supabase
    .from("exam_dates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) return err({ code: "DB", message: "Couldn't delete the exam." });
  if (!data || data.length === 0) {
    return err({ code: "NOT_FOUND", message: "Exam not found." });
  }

  revalidatePath("/app/dashboard");
  revalidatePath("/app/workspace");
  return ok(null);
}
