import type { Metadata } from "next";

import { ContinueHero } from "@/features/dashboard/components/continue-hero";
import { Fab } from "@/features/dashboard/components/fab";
import { GreetingHeader } from "@/features/dashboard/components/greeting-header";
import { SubjectsGrid } from "@/features/dashboard/components/subjects-grid";
import { TodaysPlan } from "@/features/dashboard/components/todays-plan";
import { TodaysSessions } from "@/features/dashboard/components/todays-sessions";
import { WeekStats } from "@/features/dashboard/components/week-stats";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Home dashboard — real data where it exists, honest zeros where it doesn't.
 * Dashboard and Workspace are peer top-level destinations (ADR-0019 revised):
 *   - Dashboard = today's summary + continue-where-you-left-off
 *   - Workspace = the storage/library view of everything
 */
export default async function DashboardPage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  const firstSubjectName = profile.subjects[0]?.name ?? profile.classLevel.name;

  const placeholderStats = [
    { label: "Study time", value: "0m" },
    { label: "Cards",      value: "0" },
    { label: "Focus",      value: "—" },
  ];

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <GreetingHeader displayName={profile.displayName} streakDays={0} />

      <div className="flex flex-col gap-6 pt-4 sm:gap-8 sm:pt-6">
        <ContinueHero
          chapterTitle={`Welcome, ${profile.displayName.split(" ")[0]}`}
          subjectName={firstSubjectName}
          chapterIndex={1}
          progressPct={0}
        />

        <TodaysSessions />

        <TodaysPlan />

        <SubjectsGrid subjects={profile.subjects} />

        <WeekStats stats={placeholderStats} />
      </div>

      <Fab href="/app/notes/new" label="New note" />
    </div>
  );
}
