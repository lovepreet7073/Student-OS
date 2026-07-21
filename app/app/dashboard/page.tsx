import type { Metadata } from "next";

import { ContinueCard } from "@/features/dashboard/components/continue-card";
import { Fab } from "@/features/dashboard/components/fab";
import { GetStartedChecklist } from "@/features/dashboard/components/get-started-checklist";
import { GreetingHeader } from "@/features/dashboard/components/greeting-header";
import { PracticeDueCard } from "@/features/dashboard/components/practice-due-card";
import { StreakCard } from "@/features/dashboard/components/streak-card";
import { SubjectStrip } from "@/features/dashboard/components/subject-strip";
import { SubjectsGrid } from "@/features/dashboard/components/subjects-grid";
import { TodaysPlan } from "@/features/dashboard/components/todays-plan";
import { TodaysSessions } from "@/features/dashboard/components/todays-sessions";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getStreakStats } from "@/features/dashboard/actions/get-streak-stats";
import { listExams } from "@/features/exams/actions/list-exams";
import { ExamCountdownCard } from "@/features/exams/components/exam-countdown-card";

export const metadata: Metadata = { title: "Today" };

/**
 * Today — the ONE page a student opens at 9 PM to know what to do.
 *
 * Order matters. Each section either shows real work or hides itself.
 * A brand-new student sees: greeting → streak → subjects. A returning
 * student adds: continue → exams → practice due → tasks → sessions.
 * Nothing on this page is decoration; every card answers "what should
 * I do now?"
 */
export default async function TodayPage() {
  const [profile, streakResult, examsResult] = await Promise.all([
    getMyProfile(),
    getStreakStats(),
    listExams({ includePast: false, limit: 20 }),
  ]);
  if (!profile) return null;

  const streak = streakResult.ok ? streakResult.data : null;
  const exams = examsResult.ok ? examsResult.data : [];

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <GreetingHeader
        displayName={profile.displayName}
        streakDays={streak?.current ?? 0}
      />

      <div className="mt-2 lg:hidden">
        <SubjectStrip subjects={profile.subjects} />
      </div>

      <div className="flex flex-col gap-5 pt-4 sm:gap-6 sm:pt-6">
        <GetStartedChecklist />

        {streak ? <StreakCard stats={streak} /> : null}

        <ContinueCard />

        <ExamCountdownCard exams={exams} subjects={profile.subjects} />

        <PracticeDueCard />

        <TodaysPlan />

        <TodaysSessions />

        <SubjectsGrid subjects={profile.subjects} />
      </div>

      <Fab href="/app/notes/new" label="New note" />
    </div>
  );
}
