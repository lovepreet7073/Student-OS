import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { StudyPlanListItem } from "../types";

interface PlanHistoryListProps {
  plans: StudyPlanListItem[];
}

export function PlanHistoryList({ plans }: PlanHistoryListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {plans.map((plan) => {
        const pct =
          plan.totalItems === 0
            ? 0
            : Math.round((plan.completedItems / plan.totalItems) * 100);
        return (
          <li key={plan.id}>
            <Link
              href={`/app/planner/${plan.id}`}
              className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[13px] font-extrabold",
                  plan.isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
                )}
              >
                {pct}%
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {plan.startDate} → {plan.endDate}
                  </span>
                  {plan.isActive ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      <Star className="h-2.5 w-2.5 fill-current" strokeWidth={2} aria-hidden />
                      Active
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 truncate text-[15px] font-bold tracking-tight">
                  {plan.title}
                </div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">
                  {plan.completedItems} / {plan.totalItems} sessions · {plan.dailyHours}h/day
                </div>
              </div>
              <ChevronRight
                className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
