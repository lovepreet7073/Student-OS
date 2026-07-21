import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listDecks } from "@/features/flashcards/actions/list-decks";
import { getReviewHeatmap } from "@/features/flashcards/actions/get-review-heatmap";
import { listWeakCards } from "@/features/flashcards/actions/list-weak-cards";
import { DeckEmptyState } from "@/features/flashcards/components/deck-empty-state";
import { DeckList } from "@/features/flashcards/components/deck-list";
import { ReviewHeatmap } from "@/features/flashcards/components/review-heatmap";

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const [result, heatmap, weakCards] = await Promise.all([
    listDecks(),
    getReviewHeatmap(),
    listWeakCards(),
  ]);
  const totalDueOrNew = !result.ok
    ? 0
    : result.data.reduce((sum, d) => sum + d.dueCards + d.newCards, 0);
  const weakCount = weakCards.ok ? weakCards.data.length : 0;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              Flashcards
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              Spaced-repetition decks. Review the hard ones more.
            </p>
          </div>
          <Button asChild size="icon" aria-label="New deck" className="lg:hidden">
            <Link href="/app/flashcards/new">
              <Sparkles className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          </Button>
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/app/flashcards/new">
              <Sparkles className="h-4 w-4" aria-hidden />
              New deck
            </Link>
          </Button>
        </div>
      </header>

      {totalDueOrNew > 0 || weakCount > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {totalDueOrNew > 0 ? (
            <Button asChild fullWidth size="lg" className="gap-2">
              <Link href="/app/flashcards/inbox">
                <Flame className="h-4 w-4" aria-hidden />
                Review {totalDueOrNew} due across all decks
              </Link>
            </Button>
          ) : null}
          {weakCount > 0 ? (
            <Button asChild fullWidth size="lg" variant="outline" className="gap-2">
              <Link href="/app/flashcards/weak">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Drill {weakCount} weak card{weakCount === 1 ? "" : "s"}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {heatmap.ok && heatmap.data.totalReviews > 0 ? (
        <section
          aria-label="Review streak"
          className="mt-5 rounded-xl border border-border bg-card p-4"
        >
          <ReviewHeatmap heatmap={heatmap.data} />
        </section>
      ) : null}

      <section aria-label="Deck list" className="pt-5">
        {!result.ok ? (
          <ErrorState title="Couldn't load your decks" description={result.error.message} />
        ) : result.data.length === 0 ? (
          <DeckEmptyState />
        ) : (
          <DeckList decks={result.data} />
        )}
      </section>
    </div>
  );
}
