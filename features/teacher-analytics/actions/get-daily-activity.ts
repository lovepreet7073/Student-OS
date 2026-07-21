"use server";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export interface DailyBucket {
  /** ISO date `YYYY-MM-DD` (UTC). */
  day: string;
  approved: number;
  rejected: number;
}

/**
 * Returns a 30-day series of approve/reject counts for the current
 * teacher. Grouping runs in JS because Supabase JS doesn't expose GROUP BY
 * without an RPC — at 30 days × ≤ 100 actions/day this is negligible.
 *
 * We always return 30 buckets, even the empty ones — the chart needs a
 * continuous x-axis, not a sparse array.
 */
export async function getTeacherDailyActivity(
  days = 30,
): Promise<Result<DailyBucket[], ActionError>> {
  const profile = await getMyProfile();
  if (!profile) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });
  if (profile.role !== "teacher") {
    return err({ code: "FORBIDDEN", message: "Teachers only." });
  }

  const supabase = await getSupabaseServer();

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const { data, error } = await supabase
    .from("community_notes")
    .select("status, moderated_at")
    .eq("moderated_by", profile.userId)
    .in("status", ["approved", "rejected"])
    .gte("moderated_at", start.toISOString());

  if (error) return err({ code: "DB", message: "Couldn't load activity." });

  const buckets = new Map<string, DailyBucket>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { day: key, approved: 0, rejected: 0 });
  }

  for (const row of data ?? []) {
    if (!row.moderated_at) continue;
    const key = new Date(row.moderated_at).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (row.status === "approved") bucket.approved += 1;
    else if (row.status === "rejected") bucket.rejected += 1;
  }

  return ok(Array.from(buckets.values()));
}
