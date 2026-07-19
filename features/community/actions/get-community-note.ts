"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { CommunityNoteDetail } from "../types";
import { toListItem } from "./_normalize";

export async function getCommunityNote(
  id: string,
): Promise<Result<CommunityNoteDetail, ActionError>> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("community_notes")
    .select(
      `
        id, author_id, author_display_name, subject_id, title, content, status,
        rejection_reason, moderated_at, likes_count, bookmarks_count, created_at,
        subject:subjects ( name )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't load the note." });
  if (!data) return err({ code: "NOT_FOUND", message: "Note not found." });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const [likeRes, bookmarkRes] = userId
    ? await Promise.all([
        supabase
          .from("community_likes")
          .select("community_note_id")
          .eq("user_id", userId)
          .eq("community_note_id", id)
          .maybeSingle(),
        supabase
          .from("community_bookmarks")
          .select("community_note_id")
          .eq("user_id", userId)
          .eq("community_note_id", id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const base = toListItem(data, {
    likedSet: likeRes.data ? new Set([id]) : new Set<string>(),
  });

  return ok({
    ...base,
    content: data.content,
    rejectionReason: data.rejection_reason,
    moderatedAt: data.moderated_at,
    hasBookmarked: !!bookmarkRes.data,
    isOwn: userId === data.author_id,
  });
}
