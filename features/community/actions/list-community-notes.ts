"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { CommunityNoteListItem } from "../types";
import { toListItem } from "./_normalize";

interface ListArgs {
  subjectId?: string;
}

/**
 * The public feed of approved community notes for the caller's academic scope
 * (same board × class × medium, plus any of their active subjects). Newest first.
 */
export async function listCommunityNotes(
  args: ListArgs = {},
): Promise<Result<CommunityNoteListItem[], ActionError>> {
  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();

  let query = supabase
    .from("community_notes")
    .select(
      `
        id, author_id, author_display_name, subject_id, title, content, status,
        likes_count, bookmarks_count, created_at,
        subject:subjects ( name )
      `,
    )
    .eq("status", "approved")
    .eq("board_id", scope.boardId)
    .eq("class_id", scope.classId)
    .eq("medium_id", scope.mediumId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (args.subjectId && scope.subjectIds.includes(args.subjectId)) {
    query = query.eq("subject_id", args.subjectId);
  } else if (scope.subjectIds.length > 0) {
    query = query.in("subject_id", scope.subjectIds);
  }

  const { data, error } = await query;
  if (error) return err({ code: "DB", message: "Couldn't load the community feed." });

  const ids = (data ?? []).map((r) => r.id);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedSet = new Set<string>();
  if (user && ids.length > 0) {
    const likesRes = await supabase
      .from("community_likes")
      .select("community_note_id")
      .eq("user_id", user.id)
      .in("community_note_id", ids);
    likedSet = new Set((likesRes.data ?? []).map((row) => row.community_note_id));
  }

  const items = (data ?? []).map((row) => toListItem(row, { likedSet }));
  return ok(items);
}
