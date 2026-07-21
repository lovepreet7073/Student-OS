"use server";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type {
  TeacherAnalyticsOverview,
  TeacherModerationActivity,
  TopContributor,
} from "../types";

/**
 * Snapshot for a teacher's analytics dashboard. All queries scoped to their
 * `(board, class, medium)` — analytics reflect the community they moderate,
 * not the whole platform.
 *
 * Everything runs in parallel; failure of any single query returns zero for
 * that slot rather than tanking the page (analytics is diagnostic — a broken
 * counter is a UI degradation, not a crash).
 */
export async function getTeacherOverview(): Promise<
  Result<TeacherAnalyticsOverview, ActionError>
> {
  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") {
    return err({ code: "FORBIDDEN", message: "Teachers only." });
  }

  const supabase = await getSupabaseServer();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekIso = oneWeekAgo.toISOString();

  const boardId = profile.board.id;
  const classId = profile.classLevel.id;
  const mediumId = profile.medium.id;
  const teacherId = profile.userId;

  const countOf = async (
    query: Promise<{ count: number | null; error: unknown }>,
  ): Promise<number> => {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  };

  const [
    approvedTotal,
    rejectedTotal,
    approvedWeek,
    rejectedWeek,
    pendingInScope,
    reportsOpen,
    recentActivityRes,
    topContributorsRes,
  ] = await Promise.all([
    countOf(
      supabase
        .from("community_notes")
        .select("id", { count: "exact", head: true })
        .eq("moderated_by", teacherId)
        .eq("status", "approved") as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("community_notes")
        .select("id", { count: "exact", head: true })
        .eq("moderated_by", teacherId)
        .eq("status", "rejected") as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("community_notes")
        .select("id", { count: "exact", head: true })
        .eq("moderated_by", teacherId)
        .eq("status", "approved")
        .gte("moderated_at", weekIso) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("community_notes")
        .select("id", { count: "exact", head: true })
        .eq("moderated_by", teacherId)
        .eq("status", "rejected")
        .gte("moderated_at", weekIso) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("community_notes")
        .select("id", { count: "exact", head: true })
        .eq("board_id", boardId)
        .eq("class_id", classId)
        .eq("medium_id", mediumId)
        .eq("status", "pending") as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("community_reports")
        .select("id", { count: "exact", head: true })
        .is("dismissed_at", null) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    supabase
      .from("community_notes")
      .select(
        `id, title, author_display_name, status, moderated_at,
         subject:subjects ( name )`,
      )
      .eq("moderated_by", teacherId)
      .in("status", ["approved", "rejected"])
      .order("moderated_at", { ascending: false })
      .limit(20),
    supabase
      .from("community_notes")
      .select("author_id, author_display_name")
      .eq("board_id", boardId)
      .eq("class_id", classId)
      .eq("medium_id", mediumId)
      .eq("status", "approved")
      .limit(1000),
  ]);

  const recentActivity: TeacherModerationActivity[] = (
    recentActivityRes.data ?? []
  ).map((row) => {
    const subj = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    const status =
      row.status === "approved" || row.status === "rejected"
        ? (row.status as "approved" | "rejected")
        : "approved";
    return {
      id: row.id,
      noteTitle: row.title,
      authorDisplayName: row.author_display_name || "Anonymous",
      subjectName: subj?.name ?? "—",
      status,
      moderatedAt: row.moderated_at ?? new Date().toISOString(),
    };
  });

  // Group the raw author rows into a leaderboard. Done in JS because
  // Supabase JS doesn't expose GROUP BY without an RPC — for our scale
  // (≤ a few thousand approved notes per scope) this is a rounding error.
  const contributorMap = new Map<
    string,
    { displayName: string; count: number }
  >();
  for (const row of topContributorsRes.data ?? []) {
    const key = row.author_id as string;
    const name = row.author_display_name || "Anonymous";
    const prev = contributorMap.get(key) ?? { displayName: name, count: 0 };
    prev.count += 1;
    prev.displayName = name;
    contributorMap.set(key, prev);
  }
  const topContributors: TopContributor[] = Array.from(contributorMap.entries())
    .map(([authorId, v]) => ({
      authorId,
      displayName: v.displayName,
      approvedCount: v.count,
    }))
    .sort((a, b) => b.approvedCount - a.approvedCount)
    .slice(0, 10);

  return ok({
    stats: {
      approvedTotal,
      rejectedTotal,
      approvedThisWeek: approvedWeek,
      rejectedThisWeek: rejectedWeek,
      pendingInScope,
      reportsOpen,
    },
    recentActivity,
    topContributors,
  });
}
