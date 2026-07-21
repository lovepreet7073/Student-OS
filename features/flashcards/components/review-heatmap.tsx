import { Flame, Trophy } from "lucide-react";

import type { ReviewHeatmap } from "../actions/get-review-heatmap";

interface Props {
  heatmap: ReviewHeatmap;
}

/**
 * A compact GitHub-style contribution heatmap. Twelve columns × seven
 * rows (Mon–Sun) — the last column is this week, ending today.
 *
 * Bucketing intensity into 5 tiers keeps the color scale readable at
 * a glance: no library, no gradient interpolation.
 */
export function ReviewHeatmap({ heatmap }: Props) {
  if (heatmap.totalReviews === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-[13px] font-bold">No reviews yet</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Study any deck and your streak starts here.
        </p>
      </div>
    );
  }

  const max = heatmap.days.reduce((m, d) => Math.max(m, d.count), 0);
  const weeks: (typeof heatmap.days[number] | null)[][] = [];
  let week: (typeof heatmap.days[number] | null)[] = [];
  const firstDate = new Date(`${heatmap.days[0]?.day}T00:00:00Z`);
  // JS: Sunday = 0. We want Monday = 0 so weeks start Monday.
  const leadingBlanks = (firstDate.getUTCDay() + 6) % 7;
  for (let i = 0; i < leadingBlanks; i++) week.push(null);

  for (const d of heatmap.days) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="flex items-center gap-1 font-bold text-warning">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {heatmap.currentStreak} day
            {heatmap.currentStreak === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Longest {heatmap.longestStreak}
          </span>
        </div>
        <span className="text-[11.5px] font-semibold text-muted-foreground">
          {heatmap.totalReviews} reviews · {heatmap.days.length} days
        </span>
      </div>

      <div className="flex gap-[3px] overflow-x-auto">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {w.map((d, j) => (
              <span
                key={j}
                title={d ? `${d.day}: ${d.count} reviews` : ""}
                className={`h-3 w-3 rounded-sm ${intensityClass(d?.count ?? 0, max)}`}
                aria-hidden={d ? undefined : true}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function intensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-muted";
  const pct = count / max;
  if (pct < 0.25) return "bg-success/25";
  if (pct < 0.5) return "bg-success/50";
  if (pct < 0.75) return "bg-success/75";
  return "bg-success";
}
