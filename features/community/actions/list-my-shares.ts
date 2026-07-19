"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { CommunityNoteListItem, CommunityNoteStatus } from "../types";
import { toListItem } from "./_normalize";

export interface MyShareItem extends CommunityNoteListItem {
  rejectionReason: string | null;
}

/**
 * Every community note the caller has ever shared, all statuses. Ordered by
 * most-recently-created so the freshest submissions surface first.
 *
 * Consumed by the "My shared notes" section on /app/profile.
 */
export async function listMyShares(): Promise<Result<MyShareItem[], ActionError>> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("community_notes")
    .select(
      `
        id, author_id, author_display_name, subject_id, title, content, status,
        rejection_reason, likes_count, bookmarks_count, created_at,
        subject:subjects ( name )
      `,
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return err({ code: "DB", message: "Couldn't load your shared notes." });

  // Show the author their own like state on their shares.
  const ids = (data ?? []).map((row) => row.id);
  let likedSet = new Set<string>();
  if (ids.length > 0) {
    const likesRes = await supabase
      .from("community_likes")
      .select("community_note_id")
      .eq("user_id", user.id)
      .in("community_note_id", ids);
    likedSet = new Set((likesRes.data ?? []).map((row) => row.community_note_id));
  }

  const items: MyShareItem[] = (data ?? []).map((row) => {
    const base = toListItem(row, { likedSet });
    return {
      ...base,
      rejectionReason: (row as { rejection_reason: string | null }).rejection_reason,
    };
  });

  return ok(items);
}

/**
 * Buckets a list of MyShareItems by status so the profile UI can render each
 * group under its own header.
 */
export function bucketByStatus(
  items: MyShareItem[],
): Record<CommunityNoteStatus, MyShareItem[]> {
  const buckets: Record<CommunityNoteStatus, MyShareItem[]> = {
    pending: [],
    approved: [],
    rejected: [],
  };
  for (const item of items) buckets[item.status].push(item);
  return buckets;
}
