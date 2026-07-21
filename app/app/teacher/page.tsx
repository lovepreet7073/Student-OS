import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getTeacherOverview } from "@/features/teacher-analytics/actions/get-teacher-overview";
import { TeacherOverviewView } from "@/features/teacher-analytics/components/teacher-overview-view";

export const metadata: Metadata = { title: "Teacher analytics" };

export default async function TeacherAnalyticsPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect("/app/workspace");

  const overview = await getTeacherOverview();
  if (!overview.ok) {
    return (
      <div className="mx-auto max-w-[1140px] px-5 pb-10 pt-4 sm:px-7 lg:px-11">
        <ErrorState
          title="Couldn't load analytics"
          description={overview.error.message}
        />
      </div>
    );
  }

  return (
    <TeacherOverviewView
      overview={overview.data}
      boardShort={profile.board.shortName}
      className={profile.classLevel.name}
      mediumName={profile.medium.name}
    />
  );
}
