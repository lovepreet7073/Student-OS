import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listPlans } from "@/features/study-planner/actions/list-plans";
import { PlanEmptyState } from "@/features/study-planner/components/plan-empty-state";
import { PlanHistoryList } from "@/features/study-planner/components/plan-history-list";

export const metadata: Metadata = { title: "Study Planner" };

export default async function PlannerPage() {
  const result = await listPlans();

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              Study Planner
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              AI-generated day-by-day plans for your goals.
            </p>
          </div>
          <Button asChild size="icon" aria-label="New plan" className="lg:hidden">
            <Link href="/app/planner/new">
              <Sparkles className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          </Button>
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/app/planner/new">
              <Sparkles className="h-4 w-4" aria-hidden />
              New plan
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Plan history" className="pt-5">
        {!result.ok ? (
          <ErrorState title="Couldn't load your plans" description={result.error.message} />
        ) : result.data.length === 0 ? (
          <PlanEmptyState />
        ) : (
          <PlanHistoryList plans={result.data} />
        )}
      </section>
    </div>
  );
}
