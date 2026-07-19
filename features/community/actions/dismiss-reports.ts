"use server";

import { revalidatePath } from "next/cache";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

/**
 * Clears every un-dismissed report on a single community note.
 * The reports stay in the DB (audit trail); only the `dismissed_at` /
 * `dismissed_by` columns get set.
 */
export async function dismissReports(
  communityNoteId: string,
): Promise<Result<{ dismissed: number }, ActionError>> {
  if (!communityNoteId) return err({ code: "VALIDATION", message: "Missing note id." });

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") return err({ code: "FORBIDDEN", message: "Teachers only." });

  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("community_reports")
    .update({
      dismissed_at: new Date().toISOString(),
      dismissed_by: profile.userId,
    })
    .eq("community_note_id", communityNoteId)
    .is("dismissed_at", null)
    .select("id");

  if (error) return err({ code: "DB", message: "Couldn't dismiss reports." });

  revalidatePath("/app/community/moderation");
  return ok({ dismissed: (data ?? []).length });
}
