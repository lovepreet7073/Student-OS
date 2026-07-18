/**
 * Local YYYY-MM-DD for today. Uses the server's timezone which, on Vercel,
 * defaults to UTC — good enough for MVP. When we ship user-timezone support
 * (Module N), swap this helper to accept a tz parameter.
 */
export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Renders a due date as "Today", "Tomorrow", "Overdue by X days", or a
 * short locale date. Nullable input for undated tasks — returns "" so the
 * caller can hide the row's meta line entirely.
 */
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const today = todayIsoDate();
  if (dueDate === today) return "Today";

  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);

  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `Overdue · ${Math.abs(diffDays)} days`;
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;

  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Whether a task's due date is in the past (based on server day). Used to
 * tint overdue rows with the danger colour.
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate < todayIsoDate();
}
