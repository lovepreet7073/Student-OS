"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

/**
 * Flips like/unlike for the caller on a community note.
 * The `likes_count` on `community_notes` is kept in sync by the DB trigger —
 * we don't touch it here.
 */
export async function toggleLike(
  communityNoteId: string,
): Promise<Result<{ liked: boolean }, ActionError>> {
  if (!communityNoteId) return err({ code: "VALIDATION", message: "Missing note id." });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const existing = await supabase
    .from("community_likes")
    .select("community_note_id")
    .eq("community_note_id", communityNoteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.data) {
    const del = await supabase
      .from("community_likes")
      .delete()
      .eq("community_note_id", communityNoteId)
      .eq("user_id", user.id);
    if (del.error) return err({ code: "DB", message: "Couldn't unlike." });
    revalidatePath(`/app/community/${communityNoteId}`);
    revalidatePath("/app/community");
    return ok({ liked: false });
  }

  const ins = await supabase
    .from("community_likes")
    .insert({ community_note_id: communityNoteId, user_id: user.id });
  if (ins.error) return err({ code: "DB", message: "Couldn't like." });

  revalidatePath(`/app/community/${communityNoteId}`);
  revalidatePath("/app/community");
  return ok({ liked: true });
}
