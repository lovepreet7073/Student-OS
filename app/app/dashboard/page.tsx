import type { Metadata } from "next";

import { ContinueHero } from "@/features/dashboard/components/continue-hero";
import { Fab } from "@/features/dashboard/components/fab";
import { GreetingHeader } from "@/features/dashboard/components/greeting-header";
import { SubjectsGrid } from "@/features/dashboard/components/subjects-grid";
import { TodaysPlan } from "@/features/dashboard/components/todays-plan";
import { WeekStats } from "@/features/dashboard/components/week-stats";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Home screen — real data where it exists, honest zeros where it doesn't.
 *
 * Real:
 *   - GreetingHeader (profile.displayName)
 *   - TodaysPlan (fetches from tasks table, feature-owned data fetching)
 *   - SubjectsGrid (profile.subjects)
 *
 * Placeholder until backing features ship:
 *   - streakDays          → will read study-session tracker
 *   - ContinueHero        → will read last-opened note (Module 4 landed but
 *                            no "last opened" tracking yet — pending)
 *   - WeekStats           → will read analytics module
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

        <TodaysPlan />

        <SubjectsGrid subjects={profile.subjects} />

        <WeekStats stats={placeholderStats} />
      </div>

      <Fab href="/app/notes/new" label="New note" />
    </div>
  );
}
