"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

/** Same shape as toggle-like — flips bookmark state for the caller. */
export async function toggleCommunityBookmark(
  communityNoteId: string,
): Promise<Result<{ bookmarked: boolean }, ActionError>> {
  if (!communityNoteId) return err({ code: "VALIDATION", message: "Missing note id." });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const existing = await supabase
    .from("community_bookmarks")
    .select("community_note_id")
    .eq("community_note_id", communityNoteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.data) {
    const del = await supabase
      .from("community_bookmarks")
      .delete()
      .eq("community_note_id", communityNoteId)
      .eq("user_id", user.id);
    if (del.error) return err({ code: "DB", message: "Couldn't remove bookmark." });
    revalidatePath(`/app/community/${communityNoteId}`);
    return ok({ bookmarked: false });
  }

  const ins = await supabase
    .from("community_bookmarks")
    .insert({ community_note_id: communityNoteId, user_id: user.id });
  if (ins.error) return err({ code: "DB", message: "Couldn't bookmark." });

  revalidatePath(`/app/community/${communityNoteId}`);
  return ok({ bookmarked: true });
}
