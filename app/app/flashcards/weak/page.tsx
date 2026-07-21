import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listWeakCards } from "@/features/flashcards/actions/list-weak-cards";
import { ReviewSession } from "@/features/flashcards/components/review-session";

export const metadata: Metadata = { title: "Weak cards review" };

/**
 * A focused review session over just the cards the student keeps missing
 * (>30% lapse ratio, min 3 reviews). Reuses <ReviewSession> and its
 * per-card SM-2 revalidation — every review still updates the source
 * deck's due-time as normal.
 */
export default async function WeakCardsReviewPage() {
  const result = await listWeakCards();
  if (!result.ok) throw new Error(result.error.message);

  if (result.data.length === 0) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-5 px-5 pb-10 pt-10 text-center sm:px-7 lg:px-11">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight">
          No weak cards
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Nothing you&apos;ve reviewed has slipped enough to land here yet.
          Keep studying and any tough cards will surface as soon as you
          fail them a few times.
        </p>
        <Button asChild fullWidth size="lg">
          <Link href="/app/flashcards">All decks</Link>
        </Button>
      </div>
    );
  }

  return (
    <ReviewSession
      deckTitle="your weak-cards drill"
      cards={result.data}
      exitHref="/app/flashcards"
      exitLabel="Back to decks"
    />
  );
}
