"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export interface StreakStats {
  /** Current consecutive-day streak (inclusive of today). */
  current: number;
  /** Longest streak seen in the last 90 days. Best-effort. */
  longest: number;
  /**
   * Activity count for each of the past 7 days, oldest → newest.
   * The last entry is today. `weekTotal` is the sum.
   */
  daily: { date: string; count: number }[];
  weekTotal: number;
  /** Whether today has ANY activity — drives the "you're on a roll" copy. */
  activeToday: boolean;
}

const DAYS_LOOKBACK = 90;

/**
 * Derives the caller's study streak + weekly heatmap from `activity_events`.
 * Cheap: one indexed query, all computation happens in Node.
 *
 * A "day" is a UTC calendar day — matches the `opened_day` generated column
 * on activity_events (Module 15 fix). A day counts as active if the user
 * had ANY event on it (opened / created / uploaded).
 */
export async function getStreakStats(): Promise<Result<StreakStats, ActionError>> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - DAYS_LOOKBACK);
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("activity_events")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) return err({ code: "DB", message: "Couldn't load streak." });

  // Bucket into UTC calendar days.
  const daySet = new Set<string>();
  const dayCounts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = new Date(row.created_at).toISOString().slice(0, 10); // YYYY-MM-DD
    daySet.add(day);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  // Current streak: walk back from today until we hit a gap.
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10);

  const activeToday = daySet.has(yyyymmdd(todayUtc));
  let current = 0;
  const cursor = new Date(todayUtc);
  // If today is active, start counting from today. If not, we still allow
  // yesterday-onward so the streak survives one "grace day" of the current UTC-day
  // boundary — but not further.
  if (!activeToday) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (daySet.has(yyyymmdd(cursor))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Longest streak in the window — sort days, walk them.
  const sortedDays = Array.from(daySet).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sortedDays) {
    if (prev !== null) {
      const prevDate = new Date(prev + "T00:00:00Z");
      const curDate = new Date(d + "T00:00:00Z");
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000);
      if (diffDays === 1) {
        run += 1;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  // Past 7 days including today (oldest first).
  const daily: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayUtc);
    d.setUTCDate(d.getUTCDate() - i);
    const key = yyyymmdd(d);
    daily.push({ date: key, count: dayCounts.get(key) ?? 0 });
  }
  const weekTotal = daily.reduce((sum, d) => sum + d.count, 0);

  return ok({ current, longest, daily, weekTotal, activeToday });
}
