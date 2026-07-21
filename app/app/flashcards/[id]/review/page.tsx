import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDeck } from "@/features/flashcards/actions/get-deck";
import { ReviewSession } from "@/features/flashcards/components/review-session";

export const metadata: Metadata = { title: "Review flashcards" };

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Loads the deck server-side and computes the review queue: new cards
 * (never reviewed) plus cards whose `due_at` has passed.
 *
 * Empty queue → render a "You're all caught up" screen with a link back
 * to the deck. Non-empty → hand off to <ReviewSession> which owns the
 * flip / rate state machine.
 */
export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const result = await getDeck(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }

  const now = Date.now();
  const queue = result.data.cards.filter(
    (c) => c.totalReviews === 0 || new Date(c.dueAt).getTime() <= now,
  );

  if (queue.length === 0) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-5 px-5 pb-10 pt-10 text-center sm:px-7 lg:px-11">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight">
          Nothing to review
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Every card in {result.data.title} is scheduled for later. Come back
          when at least one card is due.
        </p>
        <Button asChild fullWidth size="lg">
          <Link href={`/app/flashcards/${result.data.id}`}>Back to deck</Link>
        </Button>
      </div>
    );
  }

  return (
    <ReviewSession
      deckTitle={result.data.title}
      cards={queue}
      exitHref={`/app/flashcards/${result.data.id}`}
      exitLabel="Back to deck"
    />
  );
}
