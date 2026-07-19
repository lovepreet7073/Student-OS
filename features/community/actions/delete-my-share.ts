"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

/**
 * Author-side "unshare" — pulls their community copy entirely. The private
 * source note in `notes` is untouched. Cascade cleans up likes / bookmarks /
 * reports.
 */
export async function deleteMyShare(
  communityNoteId: string,
): Promise<Result<null, ActionError>> {
  if (!communityNoteId) return err({ code: "VALIDATION", message: "Missing note id." });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { error } = await supabase
    .from("community_notes")
    .delete()
    .eq("id", communityNoteId)
    .eq("author_id", user.id);

  if (error) return err({ code: "DB", message: "Couldn't remove the share." });

  revalidatePath("/app/profile");
  revalidatePath("/app/community");
  return ok(null);
}
