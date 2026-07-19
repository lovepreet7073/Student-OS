"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { CommunityNoteListItem } from "../types";
import { toListItem } from "./_normalize";

export interface ContributorProfile {
  authorId: string;
  displayName: string;
  approvedCount: number;
  totalLikes: number;
  totalBookmarks: number;
  notes: CommunityNoteListItem[];
}

/**
 * All approved shares by a single author, scope-filtered so students on other
 * boards can't fingerprint someone across the app. The author's display name
 * comes from the notes themselves (snapshot), so a contributor with zero
 * approved notes returns NOT_FOUND rather than an empty shell.
 */
export async function getContributor(
  authorId: string,
): Promise<Result<ContributorProfile, ActionError>> {
  if (!authorId) return err({ code: "VALIDATION", message: "Missing author id." });

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

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
    .eq("author_id", authorId)
    .eq("status", "approved")
    .eq("board_id", scope.boardId)
    .eq("class_id", scope.classId)
    .eq("medium_id", scope.mediumId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return err({ code: "DB", message: "Couldn't load the contributor." });
  const rows = data ?? [];
  if (rows.length === 0) return err({ code: "NOT_FOUND", message: "No shares found." });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedSet = new Set<string>();
  if (user) {
    const ids = rows.map((r) => r.id);
    const likesRes = await supabase
      .from("community_likes")
      .select("community_note_id")
      .eq("user_id", user.id)
      .in("community_note_id", ids);
    likedSet = new Set((likesRes.data ?? []).map((row) => row.community_note_id));
  }

  const notes = rows.map((row) => toListItem(row, { likedSet }));
  const totalLikes = notes.reduce((sum, n) => sum + n.likesCount, 0);
  const totalBookmarks = notes.reduce((sum, n) => sum + n.bookmarksCount, 0);
  const displayName = notes[0]?.authorDisplayName ?? "Anonymous";

  return ok({
    authorId,
    displayName,
    approvedCount: notes.length,
    totalLikes,
    totalBookmarks,
    notes,
  });
}
