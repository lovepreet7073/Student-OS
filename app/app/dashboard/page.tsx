import type { Metadata } from "next";

import { ContinueHero } from "@/features/dashboard/components/continue-hero";
import { Fab } from "@/features/dashboard/components/fab";
import { GreetingHeader } from "@/features/dashboard/components/greeting-header";
import { StreakCard } from "@/features/dashboard/components/streak-card";
import { SubjectsGrid } from "@/features/dashboard/components/subjects-grid";
import { TodaysPlan } from "@/features/dashboard/components/todays-plan";
import { TodaysSessions } from "@/features/dashboard/components/todays-sessions";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getStreakStats } from "@/features/dashboard/actions/get-streak-stats";
import { listExams } from "@/features/exams/actions/list-exams";
import { ExamCountdownCard } from "@/features/exams/components/exam-countdown-card";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Home dashboard — the "Today" view. Everything here is about what to do
 * RIGHT NOW: streak (motivation), continue where you left off, today's plan,
 * subject quick-nav. Content browsing lives on /app/workspace.
 */
export default async function DashboardPage() {
  const [profile, streakResult, examsResult] = await Promise.all([
    getMyProfile(),
    getStreakStats(),
    listExams({ includePast: false, limit: 20 }),
  ]);
  if (!profile) return null;

  const firstSubjectName = profile.subjects[0]?.name ?? profile.classLevel.name;
  const streak = streakResult.ok ? streakResult.data : null;
  const exams = examsResult.ok ? examsResult.data : [];

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <GreetingHeader
        displayName={profile.displayName}
        streakDays={streak?.current ?? 0}
      />

      <div className="flex flex-col gap-6 pt-4 sm:gap-8 sm:pt-6">
        {streak ? <StreakCard stats={streak} /> : null}

        <ExamCountdownCard exams={exams} subjects={profile.subjects} />

        <ContinueHero
          chapterTitle={`Welcome, ${profile.displayName.split(" ")[0]}`}
          subjectName={firstSubjectName}
          chapterIndex={1}
          progressPct={0}
        />

        <TodaysSessions />

        <TodaysPlan />

        <SubjectsGrid subjects={profile.subjects} />
      </div>

      <Fab href="/app/notes/new" label="New note" />
    </div>
  );
}
