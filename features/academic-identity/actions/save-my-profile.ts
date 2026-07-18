"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  savePreferencesSchema,
  type SavePreferencesInput,
} from "../schemas/preferences";

/**
 * Upserts the user's preferences row AND replaces their subject selections.
 *
 * We can't wrap two Supabase calls in a real transaction from the client SDK,
 * so we accept the read-your-writes risk: preferences row is written first,
 * then subjects are diffed. If subjects fail the user still has a valid
 * profile (empty subjects), which the UI treats as "incomplete" and re-prompts.
 */
export async function saveMyProfile(
  input: SavePreferencesInput,
  options?: { redirectTo?: string },
): Promise<Result<null, ActionError>> {
  const parsed = savePreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your selections.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return err({ code: "UNAUTHORIZED", message: "Please sign in again." });
  }

  const { boardId, mediumId, classId, subjectIds, preferredLanguage } = parsed.data;

  const upsertResult = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        board_id: boardId,
        medium_id: mediumId,
        class_id: classId,
        preferred_language: preferredLanguage,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (upsertResult.error) {
    return err({
      code: "DB",
      message: "Couldn't save your preferences. Please try again.",
    });
  }

  // Replace subject selections: delete then insert. Small N (≤ 20), safe.
  const deleteResult = await supabase
    .from("user_subjects")
    .delete()
    .eq("user_id", user.id);

  if (deleteResult.error) {
    return err({
      code: "DB",
      message: "Couldn't update your subjects. Please try again.",
    });
  }

  if (subjectIds.length > 0) {
    const rows = subjectIds.map((subject_id) => ({ user_id: user.id, subject_id }));
    const insertResult = await supabase.from("user_subjects").insert(rows);
    if (insertResult.error) {
      return err({
        code: "DB",
        message: "Couldn't save your subject selections. Please try again.",
      });
    }
  }

  revalidatePath("/", "layout");

  if (options?.redirectTo) {
    redirect(options.redirectTo);
  }

  return ok(null);
}
