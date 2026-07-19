"use server";

import { revalidatePath } from "next/cache";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { moderateNoteSchema, type ModerateNoteInput } from "../schemas/community";

/**
 * Teacher approves or rejects a pending community note. Rejects require a
 * short reason so the author can learn from it. All arithmetic (status +
 * timestamp + moderator id) is set server-side; the client only sends intent.
 */
export async function moderateNote(
  input: ModerateNoteInput,
): Promise<Result<null, ActionError>> {
  const parsed = moderateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Please check your input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") {
    return err({ code: "FORBIDDEN", message: "Teachers only." });
  }

  const supabase = await getSupabaseServer();
  const nextStatus = parsed.data.action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("community_notes")
    .update({
      status: nextStatus,
      rejection_reason: parsed.data.action === "reject" ? parsed.data.reason ?? null : null,
      moderated_by: profile.userId,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending");

  if (error) return err({ code: "DB", message: "Couldn't update the note." });

  revalidatePath("/app/community");
  revalidatePath("/app/community/moderation");
  revalidatePath(`/app/community/${parsed.data.id}`);
  return ok(null);
}
