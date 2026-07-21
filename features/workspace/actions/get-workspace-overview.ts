"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { WorkspaceOverview } from "../types";

/**
 * Counts across every workspace category for the current user. Everything
 * runs in parallel and uses `count: "exact", head: true` — no rows returned,
 * just the total. Fast even at scale.
 *
 * Failures on individual counts return zero for that slot rather than tanking
 * the whole page — a broken counter is a UI degradation, not a crash.
 */
export async function getWorkspaceOverview(): Promise<
  Result<WorkspaceOverview, ActionError>
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const todayIso = new Date();
  todayIso.setHours(23, 59, 59, 999);
  const endOfToday = todayIso.toISOString();

  const countOf = async (
    query: Promise<{ count: number | null; error: unknown }>,
  ): Promise<number> => {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  };

  const [
    notes,
    files,
    tasksTotal,
    tasksOpenToday,
    bookmarks,
    quizzes,
    activePlan,
    evaluations,
    community,
    flashcardDecks,
    flashcardsDueToday,
  ] = await Promise.all([
    countOf(
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("study_files")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("completed_at", null)
        .lte("due_date", endOfToday) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_bookmarked", true) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("quizzes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    (async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      return !error && !!data;
    })(),
    countOf(
      supabase
        .from("test_evaluations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("community_notes")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("flashcard_decks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
    countOf(
      supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("due_at", endOfToday) as unknown as Promise<{
        count: number | null;
        error: unknown;
      }>,
    ),
  ]);

  return ok({
    notes,
    files,
    tasks: { total: tasksTotal, openToday: tasksOpenToday },
    bookmarkedNotes: bookmarks,
    quizzes,
    studyPlanActive: activePlan,
    testEvaluations: evaluations,
    sharedToCommunity: community,
    flashcardDecks,
    flashcardsDueToday,
  });
}
