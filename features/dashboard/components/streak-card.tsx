import { Flame, Trophy } from "lucide-react";

import type { StreakStats } from "../actions/get-streak-stats";

interface Props {
  stats: StreakStats;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Streak hero + 7-day heatmap. Sits above the fold on the Dashboard.
 *
 * Design intent:
 *   - Streak number is the largest element — it's the emotional hook.
 *   - The heatmap shows the last 7 days as filled/empty dots. A single
 *     glance tells the student "I've been consistent" or "I skipped 3 days".
 *   - Today is highlighted with a ring so the student sees where "today"
 *     lives on the calendar without having to count.
 *   - Empty state (streak = 0) uses gentle copy — never shame the user.
 */
export function StreakCard({ stats }: Props) {
  const { current, longest, daily, weekTotal, activeToday } = stats;
  const isBrandNew = current === 0 && weekTotal === 0;

  return (
    <section
      aria-label="Study streak"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-[42px] font-extrabold leading-none tracking-tight sm:text-[52px] ${
                current > 0 ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {current}
            </span>
            <span className="text-[15px] font-bold text-muted-foreground">
              {current === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-warning" strokeWidth={2} aria-hidden />
            {isBrandNew
              ? "Start today — open a note or take a quiz."
              : activeToday
                ? "On a roll — you've studied today"
                : "Keep it going — do one thing today"}
          </div>
        </div>

        {longest > 0 ? (
          <div
            className="flex flex-col items-end text-right"
            aria-label={`Longest streak ${longest} days`}
          >
            <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
              <Trophy className="h-3 w-3 text-warning" strokeWidth={2.4} aria-hidden />
              Best
            </div>
            <div className="text-[16px] font-extrabold tracking-tight">
              {longest} {longest === 1 ? "day" : "days"}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>This week</span>
          <span>
            {weekTotal} {weekTotal === 1 ? "event" : "events"}
          </span>
        </div>
        <div className="flex items-end justify-between gap-1.5">
          {daily.map((d, idx) => {
            const isToday = idx === daily.length - 1;
            const active = d.count > 0;
            return (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center gap-1.5"
                aria-label={`${d.date}: ${d.count} events`}
              >
                <div
                  className={`h-9 w-full rounded-md transition-colors ${
                    active
                      ? "bg-primary/70"
                      : isToday
                        ? "bg-secondary ring-2 ring-primary/30"
                        : "bg-secondary"
                  }`}
                />
                <span
                  className={`text-[10.5px] font-bold ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {WEEKDAY_LETTERS[new Date(d.date + "T00:00:00Z").getUTCDay()]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
