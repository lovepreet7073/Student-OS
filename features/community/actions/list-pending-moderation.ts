"use server";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { CommunityNoteListItem } from "../types";
import { toListItem } from "./_normalize";

/**
 * The teacher moderation queue — pending community notes scoped to the same
 * board × class × medium as the moderating teacher. Oldest first so nothing
 * gets stuck at the bottom.
 */
export async function listPendingModeration(): Promise<
  Result<CommunityNoteListItem[], ActionError>
> {
  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") {
    return err({ code: "FORBIDDEN", message: "Teachers only." });
  }

  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("community_notes")
    .select(
      `
        id, author_id, author_display_name, subject_id, title, content, status,
        likes_count, bookmarks_count, created_at,
        subject:subjects ( name )
      `,
    )
    .eq("status", "pending")
    .eq("board_id", profile.board.id)
    .eq("class_id", profile.classLevel.id)
    .eq("medium_id", profile.medium.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return err({ code: "DB", message: "Couldn't load the queue." });

  const items = (data ?? []).map((row) => toListItem(row, { likedSet: new Set() }));
  return ok(items);
}
