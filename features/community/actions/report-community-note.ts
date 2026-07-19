"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { reportNoteSchema, type ReportNoteInput } from "../schemas/community";

/**
 * A student flags a note for teacher review. The unique constraint on
 * (community_note_id, user_id) enforces one report per user per note.
 */
export async function reportCommunityNote(
  input: ReportNoteInput,
): Promise<Result<null, ActionError>> {
  const parsed = reportNoteSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { error } = await supabase.from("community_reports").insert({
    community_note_id: parsed.data.id,
    user_id: user.id,
    reason: parsed.data.reason,
  });

  if (error) {
    if (error.code === "23505") {
      return err({ code: "CONFLICT", message: "You've already reported this note." });
    }
    return err({ code: "DB", message: "Couldn't submit the report." });
  }

  revalidatePath(`/app/community/${parsed.data.id}`);
  return ok(null);
}
