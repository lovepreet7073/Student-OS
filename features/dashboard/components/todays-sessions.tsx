import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";

import { getActivePlanToday } from "@/features/study-planner/actions/get-active-plan-today";
import { PlanSessionRow } from "@/features/study-planner/components/plan-session-row";

/**
 * Dashboard widget: today's study sessions from the currently-active plan.
 * Renders nothing (returns null) if there's no active plan AND no items,
 * so the dashboard stays uncluttered for users who haven't created a plan.
 *
 * When there's an active plan but no sessions for today, shows a compact
 * "rest day" note — reinforces that the plan is still on track.
 */
export async function TodaysSessions() {
  const { planId, planTitle, items } = await getActivePlanToday();

  if (!planId) return null;

  const remaining = items.filter((i) => !i.completedAt).length;

  return (
    <section aria-label="Today's study sessions" className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Today&rsquo;s study</h2>
          <div className="text-[12.5px] text-muted-foreground/80">from {planTitle}</div>
        </div>
        {items.length > 0 ? (
          <Link
            href={`/app/planner/${planId}`}
            className="text-[13px] font-bold text-primary hover:underline"
          >
            {remaining} left
          </Link>
        ) : null}
      </div>

      {items.length > 0 ? (
        <>
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => (
              <PlanSessionRow key={item.id} item={item} />
            ))}
          </ul>
          <Link
            href={`/app/planner/${planId}`}
            className="inline-flex items-center justify-center gap-1 self-end text-[13px] font-bold text-primary hover:underline"
          >
            See full plan
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          </Link>
        </>
      ) : (
        <Link
          href={`/app/planner/${planId}`}
          className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <CalendarRange
            className="h-5 w-5 flex-shrink-0 text-muted-foreground"
            strokeWidth={1.8}
            aria-hidden
          />
          <div className="flex-1">
            <div className="text-[14px] font-bold">No sessions scheduled today</div>
            <div className="text-[12.5px] text-muted-foreground">Tap to view the full plan</div>
          </div>
        </Link>
      )}
    </section>
  );
}
