import Link from "next/link";
import { AlertTriangle, Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listDecks } from "../actions/list-decks";
import { getReviewHeatmap } from "../actions/get-review-heatmap";
import { listWeakCards } from "../actions/list-weak-cards";
import { DeckEmptyState } from "./deck-empty-state";
import { DeckList } from "./deck-list";
import { ReviewHeatmap } from "./review-heatmap";

/**
 * The flashcard-tab body of the Practice hub (`/app/practice?view=flashcards`)
 * AND the standalone `/app/flashcards` redirect target's fallback.
 *
 * Fetches its own data — each Practice tab is fully self-contained so
 * the hub page doesn't need to know what any given view needs.
 */
export async function FlashcardsHubView() {
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
    <div className="flex flex-col gap-5">
      {totalDueOrNew > 0 || weakCount > 0 ? (
        <div className="flex flex-col gap-2">
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
          className="rounded-xl border border-border bg-card p-4"
        >
          <ReviewHeatmap heatmap={heatmap.data} />
        </section>
      ) : null}

      <section aria-label="Deck list">
        {!result.ok ? (
          <ErrorState
            title="Couldn't load your decks"
            description={result.error.message}
          />
        ) : result.data.length === 0 ? (
          <DeckEmptyState />
        ) : (
          <DeckList decks={result.data} />
        )}
      </section>

      <div className="lg:hidden">
        <Button asChild fullWidth variant="outline" size="lg">
          <Link href="/app/flashcards/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            New deck
          </Link>
        </Button>
      </div>
    </div>
  );
}
