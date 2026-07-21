"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export interface HeatmapDay {
  /** ISO date `YYYY-MM-DD` (UTC). */
  day: string;
  count: number;
}

export interface ReviewHeatmap {
  days: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
}

/**
 * A GitHub-style contribution grid for flashcard reviews.
 *
 * Returns `spanDays` continuous buckets (default 84 = 12 weeks) ending
 * today. Grouping runs in JS at the action layer — for a heavy user
 * (say 100 reviews/day) that's ~8400 rows, still trivial. If it grows
 * past that we'll swap in a daily-aggregate table.
 *
 * `currentStreak` counts consecutive review days back from today
 * (today counts if there was any review today; otherwise the streak
 * anchors at yesterday). `longestStreak` walks the full window.
 */
export async function getReviewHeatmap(
  spanDays = 84,
): Promise<Result<ReviewHeatmap, ActionError>> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (spanDays - 1));

  const { data, error } = await supabase
    .from("flashcard_reviews")
    .select("reviewed_at")
    .eq("user_id", user.id)
    .gte("reviewed_at", start.toISOString());

  if (error) return err({ code: "DB", message: "Couldn't load review history." });

  const buckets = new Map<string, number>();
  for (let i = 0; i < spanDays; i++) {
    const d = new Date(start.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    if (!row.reviewed_at) continue;
    const key = new Date(row.reviewed_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const days: HeatmapDay[] = Array.from(buckets.entries()).map(
    ([day, count]) => ({ day, count }),
  );

  // Streaks — walk backwards from the most recent day.
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if ((days[i]?.count ?? 0) > 0) currentStreak += 1;
    else break;
  }

  let longestStreak = 0;
  let running = 0;
  for (const d of days) {
    if (d.count > 0) {
      running += 1;
      if (running > longestStreak) longestStreak = running;
    } else {
      running = 0;
    }
  }

  return ok({
    days,
    currentStreak,
    longestStreak,
    totalReviews: (data ?? []).length,
  });
}
