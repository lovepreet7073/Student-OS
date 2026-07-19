import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { listPendingModeration } from "@/features/community/actions/list-pending-moderation";
import { listReportedNotes } from "@/features/community/actions/list-reported-notes";
import { ModerationEmptyState } from "@/features/community/components/community-empty-state";
import { ModerationQueue } from "@/features/community/components/moderation-queue";
import { ModerationTabs } from "@/features/community/components/moderation-tabs";
import { ReportTriageList } from "@/features/community/components/report-triage-list";

export const metadata: Metadata = { title: "Moderation queue" };

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ModerationPage({ searchParams }: Props) {
  const profile = await getMyProfile();
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect("/app/community");

  const { tab } = await searchParams;
  const activeTab: "pending" | "reported" = tab === "reported" ? "reported" : "pending";

  const [pending, reported] = await Promise.all([
    listPendingModeration(),
    listReportedNotes(),
  ]);

  const pendingCount = pending.ok ? pending.data.length : 0;
  const reportedCount = reported.ok ? reported.data.length : 0;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] flex-col gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              Moderation
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              {activeTab === "reported"
                ? "Approved notes flagged by your peers."
                : "New submissions from your board, class and medium."}
            </p>
          </div>
          <ModerationTabs pendingCount={pendingCount} reportedCount={reportedCount} />
        </div>
      </header>

      <section aria-label={activeTab === "reported" ? "Report queue" : "Pending queue"} className="pt-5">
        {activeTab === "pending" ? (
          !pending.ok ? (
            <ErrorState title="Couldn't load the queue" description={pending.error.message} />
          ) : pending.data.length === 0 ? (
            <ModerationEmptyState />
          ) : (
            <ModerationQueue items={pending.data} />
          )
        ) : !reported.ok ? (
          <ErrorState title="Couldn't load reports" description={reported.error.message} />
        ) : reported.data.length === 0 ? (
          <ModerationEmptyState />
        ) : (
          <ReportTriageList items={reported.data} />
        )}
      </section>
    </div>
  );
}
