"use server";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { CommunityNoteListItem } from "../types";
import { toListItem } from "./_normalize";

export interface ReportedNoteItem extends CommunityNoteListItem {
  reportsCount: number;
  latestReason: string;
  latestReportedAt: string;
}

/**
 * Teacher-only triage queue: approved notes that have one or more
 * un-dismissed reports. Sorted by newest report first so pressing issues
 * float to the top.
 */
export async function listReportedNotes(): Promise<Result<ReportedNoteItem[], ActionError>> {
  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") return err({ code: "FORBIDDEN", message: "Teachers only." });

  const supabase = await getSupabaseServer();

  const reportsRes = await supabase
    .from("community_reports")
    .select("community_note_id, reason, created_at")
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (reportsRes.error) {
    return err({ code: "DB", message: "Couldn't load reports." });
  }

  const rows = reportsRes.data ?? [];
  if (rows.length === 0) return ok([]);

  // Aggregate per-note so a spammed note only shows once with a count.
  const perNote = new Map<
    string,
    { count: number; latestReason: string; latestReportedAt: string }
  >();
  for (const r of rows) {
    const existing = perNote.get(r.community_note_id);
    if (existing) {
      existing.count += 1;
    } else {
      perNote.set(r.community_note_id, {
        count: 1,
        latestReason: r.reason,
        latestReportedAt: r.created_at,
      });
    }
  }

  const noteIds = Array.from(perNote.keys());
  const notesRes = await supabase
    .from("community_notes")
    .select(
      `
        id, author_id, author_display_name, subject_id, title, content, status,
        likes_count, bookmarks_count, created_at,
        subject:subjects ( name )
      `,
    )
    .in("id", noteIds)
    .eq("board_id", profile.board.id)
    .eq("class_id", profile.classLevel.id)
    .eq("medium_id", profile.medium.id);

  if (notesRes.error) {
    return err({ code: "DB", message: "Couldn't load reported notes." });
  }

  const items: ReportedNoteItem[] = (notesRes.data ?? [])
    .map((row) => {
      const meta = perNote.get(row.id)!;
      const base = toListItem(row, { likedSet: new Set() });
      return {
        ...base,
        reportsCount: meta.count,
        latestReason: meta.latestReason,
        latestReportedAt: meta.latestReportedAt,
      };
    })
    // Keep newest-report-first order.
    .sort(
      (a, b) => Date.parse(b.latestReportedAt) - Date.parse(a.latestReportedAt),
    );

  return ok(items);
}
