import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FlashcardsHubView } from "@/features/flashcards/components/flashcards-hub-view";
import {
  PracticeViewTabs,
  type PracticeView,
} from "@/features/practice/components/practice-view-tabs";
import { QuizzesHubView } from "@/features/quizzes/components/quizzes-hub-view";
import { TestsHubView } from "@/features/test-evaluations/components/tests-hub-view";

export const metadata: Metadata = { title: "Practice" };

interface Props {
  searchParams: Promise<{ view?: string }>;
}

function parseView(raw: string | undefined): PracticeView {
  if (raw === "quizzes" || raw === "tests") return raw;
  return "flashcards";
}

/**
 * Practice hub (Module 59) — one URL, three modes.
 *
 * Flashcards, Quizzes, and Test Evaluations were three separate
 * top-level pages, each with a couple dozen lines of near-identical
 * page shell. That split forced students to remember which feature
 * they wanted before they could open it, when the mental model is
 * "I want to practice, in whatever mode fits my energy right now."
 *
 * The `?view=` tabs let a student switch modes without leaving the
 * page. Each tab-body component (`<FlashcardsHubView>` etc.) is a
 * server component that fetches its own data — the hub page doesn't
 * need to know which action feeds which tab. Old top-level routes
 * (`/app/study`, `/app/flashcards`, `/app/tests`) redirect here with
 * the appropriate view param.
 *
 * The "New X" CTA in the header changes per view because "New quiz"
 * and "New deck" and "Grade a test" go to different creators — same
 * button intent, different destinations.
 */
export default async function PracticePage({ searchParams }: Props) {
  const params = await searchParams;
  const view = parseView(params.view);

  const createHref =
    view === "quizzes"
      ? "/app/study/new"
      : view === "tests"
        ? "/app/tests/new"
        : "/app/flashcards/new";

  const createLabel =
    view === "quizzes"
      ? "New quiz"
      : view === "tests"
        ? "Grade a test"
        : "New deck";

  const description =
    view === "quizzes"
      ? "AI-generated quizzes for your syllabus."
      : view === "tests"
        ? "AI grades your paper tests with per-question feedback."
        : "Spaced-repetition decks. Review the hard ones more.";

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] flex-col gap-3.5 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                Practice
              </h1>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                {description}
              </p>
            </div>
            <Button asChild size="icon" aria-label={createLabel} className="lg:hidden">
              <Link href={createHref}>
                <Sparkles className="h-[18px] w-[18px]" aria-hidden />
              </Link>
            </Button>
            <Button asChild className="hidden lg:inline-flex">
              <Link href={createHref}>
                <Sparkles className="h-4 w-4" aria-hidden />
                {createLabel}
              </Link>
            </Button>
          </div>
          <PracticeViewTabs active={view} />
        </div>
      </header>

      <section className="pt-5" aria-label={`${view} view`}>
        {view === "flashcards" ? <FlashcardsHubView /> : null}
        {view === "quizzes" ? <QuizzesHubView /> : null}
        {view === "tests" ? <TestsHubView /> : null}
      </section>
    </div>
  );
}
