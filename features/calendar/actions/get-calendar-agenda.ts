"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export type CalendarEventType = "exam" | "task" | "study_session";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string | null;
  href: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD (UTC calendar day)
  weekday: string; // "Mon", "Tue"
  isToday: boolean;
  events: CalendarEvent[];
}

export interface CalendarAgenda {
  days: CalendarDay[];
  totalEvents: number;
}

/**
 * Unifies exams + tasks + planner sessions into one date-ordered agenda.
 * Default range: today + next 30 days.
 *
 * Uses three flat queries in parallel; buckets in Node. Each event has a
 * `type` so the UI can colour-code / prioritise. Exams first, tasks second,
 * sessions last within a given day.
 */
export async function getCalendarAgenda(
  options: { days?: number } = {},
): Promise<Result<CalendarAgenda, ActionError>> {
  const days = Math.min(Math.max(options.days ?? 30, 7), 90);

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10);
  const startIso = yyyymmdd(today);
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + days - 1);
  const endIso = yyyymmdd(endDate);

  const [examsRes, tasksRes, sessionsRes] = await Promise.all([
    supabase
      .from("exam_dates")
      .select(`id, name, exam_date, subject:subjects ( name )`)
      .eq("user_id", user.id)
      .gte("exam_date", startIso)
      .lte("exam_date", endIso),
    supabase
      .from("tasks")
      .select(`id, title, due_date, notes, subject:subjects ( name ), completed_at`)
      .eq("user_id", user.id)
      .gte("due_date", startIso)
      .lte("due_date", endIso)
      .is("completed_at", null),
    supabase
      .from("study_plan_items")
      .select(
        `id, plan_id, plan_date, topic, subject_name, duration_minutes, is_completed`,
      )
      .eq("user_id", user.id)
      .gte("plan_date", startIso)
      .lte("plan_date", endIso),
  ]);

  if (examsRes.error || tasksRes.error || sessionsRes.error) {
    return err({ code: "DB", message: "Couldn't load your calendar." });
  }

  // Bucket per-date.
  const buckets = new Map<string, CalendarEvent[]>();
  const push = (date: string, event: CalendarEvent) => {
    const arr = buckets.get(date) ?? [];
    arr.push(event);
    buckets.set(date, arr);
  };

  for (const row of examsRes.data ?? []) {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    push(row.exam_date, {
      id: `exam-${row.id}`,
      type: "exam",
      date: row.exam_date,
      title: row.name,
      subtitle: subject?.name ?? null,
      href: "/app/dashboard",
    });
  }
  for (const row of tasksRes.data ?? []) {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    // Tasks store due_date as a timestamptz; slice to YYYY-MM-DD.
    const day = String(row.due_date).slice(0, 10);
    push(day, {
      id: `task-${row.id}`,
      type: "task",
      date: day,
      title: row.title,
      subtitle: subject?.name ?? "Task",
      href: "/app/tasks",
    });
  }
  for (const row of sessionsRes.data ?? []) {
    if (row.is_completed) continue; // hide completed sessions
    push(row.plan_date, {
      id: `session-${row.id}`,
      type: "study_session",
      date: row.plan_date,
      title: row.topic,
      subtitle: `${row.subject_name} · ${row.duration_minutes} min`,
      href: `/app/planner/${row.plan_id}`,
    });
  }

  // Build day list — every day in range, empty ones filtered later.
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days_: CalendarDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = yyyymmdd(d);
    const events = (buckets.get(iso) ?? []).sort((a, b) => {
      // Order within day: exams → tasks → sessions
      const rank: Record<CalendarEventType, number> = {
        exam: 0,
        task: 1,
        study_session: 2,
      };
      return rank[a.type] - rank[b.type];
    });
    days_.push({
      date: iso,
      weekday: WEEKDAYS[d.getUTCDay()] ?? "",
      isToday: i === 0,
      events,
    });
  }

  const totalEvents = days_.reduce((sum, d) => sum + d.events.length, 0);
  return ok({ days: days_, totalEvents });
}
