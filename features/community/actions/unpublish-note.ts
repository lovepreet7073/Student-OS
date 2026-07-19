"use server";

import { revalidatePath } from "next/cache";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { moderateNoteSchema, type ModerateNoteInput } from "../schemas/community";

/**
 * Teachers can pull an already-approved note. Sets status back to `rejected`
 * with the moderator's reason. All open reports on the note are auto-dismissed
 * at the same time so they stop cluttering the triage queue.
 *
 * Reuses `moderateNoteSchema` for reason validation (≥3 chars) — same shape,
 * different intent.
 */
export async function unpublishNote(
  input: ModerateNoteInput,
): Promise<Result<null, ActionError>> {
  const parsed = moderateNoteSchema.safeParse({ ...input, action: "reject" });
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please provide a reason.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") return err({ code: "FORBIDDEN", message: "Teachers only." });

  const supabase = await getSupabaseServer();
  const now = new Date().toISOString();

  const noteUpdate = await supabase
    .from("community_notes")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.reason ?? null,
      moderated_by: profile.userId,
      moderated_at: now,
    })
    .eq("id", parsed.data.id)
    .eq("status", "approved");

  if (noteUpdate.error) return err({ code: "DB", message: "Couldn't unpublish." });

  // Auto-dismiss any open reports so the triage queue reflects the resolution.
  await supabase
    .from("community_reports")
    .update({ dismissed_at: now, dismissed_by: profile.userId })
    .eq("community_note_id", parsed.data.id)
    .is("dismissed_at", null);

  revalidatePath("/app/community");
  revalidatePath("/app/community/moderation");
  revalidatePath(`/app/community/${parsed.data.id}`);
  return ok(null);
}
