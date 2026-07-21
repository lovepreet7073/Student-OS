import type { Metadata } from "next";
import Link from "next/link";
import { PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listDueCards } from "@/features/flashcards/actions/list-due-cards";
import { ReviewSession } from "@/features/flashcards/components/review-session";

export const metadata: Metadata = { title: "Review inbox" };

/**
 * Cross-deck review. Loads every card the caller has that's due right now
 * (interleaved across decks by `due_at asc`) and hands them to the shared
 * <ReviewSession>. Each card's `reviewCard` server call revalidates the
 * source deck by its own id, so the per-deck views stay in sync.
 */
export default async function ReviewInboxPage() {
  const result = await listDueCards();
  if (!result.ok) throw new Error(result.error.message);

  if (result.data.length === 0) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-5 px-5 pb-10 pt-10 text-center sm:px-7 lg:px-11">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight">
          Nothing due right now
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Every card across your decks is scheduled for later. Come back
          when at least one is due, or generate a new deck.
        </p>
        <Button asChild fullWidth size="lg">
          <Link href="/app/flashcards">All decks</Link>
        </Button>
      </div>
    );
  }

  return (
    <ReviewSession
      deckTitle="your review inbox"
      cards={result.data}
      exitHref="/app/flashcards"
      exitLabel="Back to decks"
    />
  );
}
