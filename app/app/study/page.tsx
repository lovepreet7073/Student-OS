import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listQuizzes } from "@/features/quizzes/actions/list-quizzes";
import { QuizEmptyState } from "@/features/quizzes/components/quiz-empty-state";
import { QuizHistoryList } from "@/features/quizzes/components/quiz-history-list";

export const metadata: Metadata = { title: "Study" };

export default async function StudyPage() {
  const result = await listQuizzes();

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              Study
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              AI-generated quizzes for your syllabus.
            </p>
          </div>
          <Button asChild size="icon" aria-label="New quiz" className="lg:hidden">
            <Link href="/app/study/new">
              <Sparkles className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          </Button>
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/app/study/new">
              <Sparkles className="h-4 w-4" aria-hidden />
              New quiz
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Quiz history" className="pt-5">
        {!result.ok ? (
          <ErrorState title="Couldn't load your quizzes" description={result.error.message} />
        ) : result.data.length === 0 ? (
          <QuizEmptyState />
        ) : (
          <QuizHistoryList quizzes={result.data} />
        )}
      </section>

      <Link
        href="/app/tests"
        className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent"
        >
          <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-[15px] font-bold tracking-tight">
            Grade a paper test with AI
          </div>
          <div className="text-[13px] text-muted-foreground">
            Snap your handwritten answers and get marks + feedback.
          </div>
        </div>
        <ArrowRight
          className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </div>
  );
}
