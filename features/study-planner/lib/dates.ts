/**
 * Local YYYY-MM-DD for today. Same tz caveat as tasks/lib/dates — server
 * timezone (UTC on Vercel) is used.
 */
export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Number of days between two ISO dates (inclusive). Both inputs are treated
 * as calendar dates at 00:00 UTC — safe for date-only comparisons.
 */
export function daysBetween(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000) + 1;
}

/**
 * Adds N calendar days to an ISO date, returning the new YYYY-MM-DD.
 * Used when converting the AI's day_offset back to a real date.
 */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/**
 * Groups plan items by their `planDate`, sorted chronologically.
 */
export function groupItemsByDay<T extends { planDate: string; ordinal: number }>(
  items: T[],
): { date: string; items: T[] }[] {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const list = buckets.get(item.planDate) ?? [];
    list.push(item);
    buckets.set(item.planDate, list);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, groupItems]) => ({
      date,
      items: groupItems.sort((a, b) => a.ordinal - b.ordinal),
    }));
}

/**
 * Formats a plan-day label like "Today", "Tomorrow", "Yesterday", or "Mon 22 Jul".
 */
export function formatPlanDayLabel(iso: string): string {
  const today = todayIsoDate();
  if (iso === today) return "Today";
  const diff = Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const dt = new Date(`${iso}T00:00:00Z`);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Formats a duration like "45m" or "1h 20m".
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
