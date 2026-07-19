import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatPlanDayLabel, todayIsoDate } from "../lib/dates";
import type { StudyPlanItem } from "../types";
import { PlanSessionRow } from "./plan-session-row";

interface PlanDayCardProps {
  date: string;
  items: StudyPlanItem[];
}

export function PlanDayCard({ date, items }: PlanDayCardProps) {
  const label = formatPlanDayLabel(date);
  const isToday = date === todayIsoDate();
  const total = items.length;
  const done = items.filter((i) => i.completedAt).length;
  const allDone = total > 0 && done === total;
  const totalMinutes = items.reduce((sum, i) => sum + i.durationMinutes, 0);

  return (
    <section
      aria-label={`${label} plan`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:p-5",
        isToday ? "border-primary/60 bg-accent" : "border-border bg-card",
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "text-[15px] font-extrabold tracking-tight",
              isToday && "text-accent-foreground",
            )}
          >
            {label}
          </h3>
          {allDone ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10.5px] font-bold text-success"
              aria-label="All done"
            >
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} aria-hidden />
              Done
            </span>
          ) : null}
        </div>
        <span className="text-[12px] font-bold text-muted-foreground/80">
          {done} / {total} · {Math.round(totalMinutes / 60 * 10) / 10}h
        </span>
      </header>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <PlanSessionRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
