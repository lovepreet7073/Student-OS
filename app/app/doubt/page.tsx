import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { listDoubts } from "@/features/doubt-solver/actions/list-doubts";
import { DoubtForm } from "@/features/doubt-solver/components/doubt-form";
import { DoubtHistoryList } from "@/features/doubt-solver/components/doubt-history-list";

export const metadata: Metadata = { title: "Ask AI" };

export default async function DoubtPage() {
  const [profile, historyResult] = await Promise.all([getMyProfile(), listDoubts(10)]);
  if (!profile) return null;

  const history = historyResult.ok ? historyResult.data : [];

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:px-11">
      <header className="pb-4 pt-4 sm:pt-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.4} aria-hidden />
          Doubt Solver
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Ask AI</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Stuck on a concept or a problem? Ask and get a step-by-step explanation.
        </p>
      </header>

      <section aria-label="Ask a new question" className="pt-2">
        <DoubtForm subjects={profile.subjects} />
      </section>

      {!historyResult.ok ? (
        <div className="pt-8">
          <ErrorState title="Couldn't load history" description={historyResult.error.message} />
        </div>
      ) : history.length > 0 ? (
        <section aria-label="Recent questions" className="pt-10">
          <h2 className="mb-3 text-[15px] font-extrabold tracking-tight">Recent questions</h2>
          <DoubtHistoryList doubts={history} />
        </section>
      ) : null}
    </div>
  );
}
