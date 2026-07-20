import type { Metadata } from "next";
import { Trophy } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { getStreakStats } from "@/features/dashboard/actions/get-streak-stats";
import { AchievementsGrid } from "@/features/gamification/components/achievements-grid";
import {
  computeAchievements,
  earnedCount,
} from "@/features/gamification/lib/achievements";
import { getWorkspaceOverview } from "@/features/workspace/actions/get-workspace-overview";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const [overviewResult, streakResult] = await Promise.all([
    getWorkspaceOverview(),
    getStreakStats(),
  ]);

  if (!overviewResult.ok || !streakResult.ok) {
    const message =
      (!overviewResult.ok ? overviewResult.error.message : null) ??
      (!streakResult.ok ? streakResult.error.message : null) ??
      "Couldn't load your achievements.";
    return (
      <div className="mx-auto max-w-[1140px] px-5 py-8 sm:px-7 lg:px-11">
        <ErrorState title="Couldn't load achievements" description={message} />
      </div>
    );
  }

  const badges = computeAchievements(overviewResult.data, streakResult.data);
  const earned = earnedCount(badges);

  return (
    <div className="mx-auto max-w-[1140px] px-5 pb-10 sm:px-7 lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto max-w-[1140px] px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:px-11 lg:pt-6">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-warning">
            <Trophy className="h-3 w-3" strokeWidth={2.4} aria-hidden />
            {earned} earned
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
            Achievements
          </h1>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Every streak, note and quiz gets you closer to the next badge.
          </p>
        </div>
      </header>

      <section className="pt-5">
        <AchievementsGrid badges={badges} />
      </section>
    </div>
  );
}
