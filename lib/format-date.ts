const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Small "2 days ago" / "just now" formatter for card metadata. Falls back to
 * a locale date string past ~30 days.
 */
export function formatRelativeTime(input: string | Date): string {
  const then = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const diffSec = Math.round((then.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return "just now";
  if (abs < 60 * 60) return RELATIVE.format(Math.round(diffSec / 60), "minute");
  if (abs < 60 * 60 * 24) return RELATIVE.format(Math.round(diffSec / 3600), "hour");
  if (abs < 60 * 60 * 24 * 30) return RELATIVE.format(Math.round(diffSec / 86400), "day");

  return then.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
