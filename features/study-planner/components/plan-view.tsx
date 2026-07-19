"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { deletePlan } from "../actions/delete-plan";
import { setActivePlan } from "../actions/set-active-plan";
import { groupItemsByDay } from "../lib/dates";
import type { StudyPlanWithItems } from "../types";
import { PlanDayCard } from "./plan-day-card";
import { PlanProgressBar } from "./plan-progress-bar";

interface PlanViewProps {
  plan: StudyPlanWithItems;
}

export function PlanView({ plan }: PlanViewProps) {
  const [deleting, startDeleteTransition] = useTransition();
  const [activating, startActivateTransition] = useTransition();

  const grouped = groupItemsByDay(plan.items);
  const total = plan.items.length;
  const completed = plan.items.filter((i) => i.completedAt).length;

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deletePlan({ id: plan.id }, { redirectTo: "/app/planner" });
      if (result && !result.ok) toast.error(result.error.message);
    });
  };

  const handleActivate = () => {
    startActivateTransition(async () => {
      const result = await setActivePlan({ planId: plan.id });
      if (!result.ok) toast.error(result.error.message);
      else toast.success("This is now your active plan.");
    });
  };

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to planner" className="mb-5 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/planner">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {plan.startDate} → {plan.endDate}
            </div>
            {plan.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                <Star className="h-3 w-3 fill-current" strokeWidth={2} aria-hidden />
                Active
              </span>
            ) : null}
          </div>
          <h1 className="truncate text-[22px] font-extrabold tracking-tight sm:text-[26px]">
            {plan.title}
          </h1>
        </div>
      </nav>

      {plan.goal ? (
        <p className="mb-5 rounded-md bg-secondary p-3.5 text-[13.5px] leading-relaxed text-foreground">
          {plan.goal}
        </p>
      ) : null}

      <div className="mb-5">
        <PlanProgressBar completed={completed} total={total} />
      </div>

      <div className="mb-6 flex gap-2">
        <Button asChild fullWidth>
          <Link href="/app/planner/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            New plan
          </Link>
        </Button>
        {!plan.isActive ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleActivate}
            disabled={activating}
            className="flex-shrink-0"
          >
            <Star className="h-4 w-4" aria-hidden />
            Set active
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete plan"
        >
          <Trash2 className={cn("h-[18px] w-[18px] text-danger")} aria-hidden />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {grouped.map((day) => (
          <PlanDayCard key={day.date} date={day.date} items={day.items} />
        ))}
      </div>
    </div>
  );
}
