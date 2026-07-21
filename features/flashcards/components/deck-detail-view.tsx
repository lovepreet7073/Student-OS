"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Flame, Play, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRelativeTime } from "@/lib/format-date";

import { deleteDeck } from "../actions/delete-deck";
import type { DeckStats } from "../actions/get-deck-stats";
import type { FlashcardDeckWithCards } from "../types";

interface DeckDetailViewProps {
  deck: FlashcardDeckWithCards;
  stats: DeckStats | null;
}

export function DeckDetailView({ deck, stats }: DeckDetailViewProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const now = Date.now();
  const total = deck.cards.length;
  const newCount = deck.cards.filter((c) => c.totalReviews === 0).length;
  const dueCount = deck.cards.filter(
    (c) => c.totalReviews > 0 && new Date(c.dueAt).getTime() <= now,
  ).length;
  const masteredCount = deck.cards.filter((c) => c.repetition >= 3).length;
  const readyToStudy = newCount + dueCount;

  async function onDelete() {
    setDeleting(true);
    const res = await deleteDeck({ deckId: deck.id });
    setDeleting(false);
    setConfirmDelete(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Deck deleted");
    router.push("/app/flashcards");
  }

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-24 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to Flashcards" className="mb-4 flex items-center justify-between gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/flashcards">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete deck"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
        </Button>
      </nav>

      <header className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {deck.subjectName}
        </div>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tight sm:text-[28px]">
          {deck.title}
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          {total} cards · created {formatRelativeTime(deck.createdAt)}
        </p>
      </header>

      <section
        aria-label="Deck stats"
        className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        <StatCard label="Due" value={dueCount} tone="warning" />
        <StatCard label="New" value={newCount} tone="primary" />
        <StatCard label="Mastered" value={masteredCount} tone="success" />
        <StatCard
          label="Retention"
          value={
            stats === null || stats.retentionPercent === null
              ? "—"
              : `${stats.retentionPercent}%`
          }
          tone="success"
        />
      </section>

      {stats && stats.totalReviews > 0 ? (
        <p className="mb-5 text-center text-[12px] text-muted-foreground">
          {stats.correctReviews}/{stats.totalReviews} reviews recalled
          {stats.reviewsLast7Days > 0
            ? ` · ${stats.reviewsLast7Days} this week`
            : ""}
        </p>
      ) : null}

      {readyToStudy > 0 ? (
        <Button asChild size="lg" fullWidth>
          <Link href={`/app/flashcards/${deck.id}/review`}>
            <Play className="h-4 w-4" aria-hidden />
            Study {readyToStudy} {readyToStudy === 1 ? "card" : "cards"}
          </Link>
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-6 text-center">
          <Sparkles className="h-5 w-5 text-success" aria-hidden />
          <p className="text-[14px] font-bold">You&apos;re up to date.</p>
          <p className="text-[13px] text-muted-foreground">
            The next card is due {formatRelativeTime(nextDue(deck))}.
          </p>
        </div>
      )}

      {(() => {
        const weakCards = deck.cards.filter(
          (c) => c.totalReviews >= 3 && c.lapses / c.totalReviews > 0.3,
        );
        if (weakCards.length === 0) return null;
        return (
          <section aria-label="Weak cards" className="mt-8">
            <div className="mb-2 flex items-center gap-2">
              <Flame
                className="h-4 w-4 text-warning"
                strokeWidth={2}
                aria-hidden
              />
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-warning">
                Needs more practice ({weakCards.length})
              </h2>
            </div>
            <p className="mb-3 text-[12.5px] text-muted-foreground">
              You&apos;ve slipped on these more than a third of the time. They&apos;ll
              come around often in your review queue.
            </p>
            <ul className="flex flex-col gap-2">
              {weakCards.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-warning/30 bg-warning/5 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-warning/80">
                      #{c.ordinal}
                    </span>
                    <span className="text-[11px] font-semibold text-warning">
                      {c.lapses}/{c.totalReviews} missed
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] font-bold tracking-tight">{c.front}</p>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{c.back}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <section aria-label="All cards" className="mt-8">
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          All cards ({total})
        </h2>
        <ul className="flex flex-col gap-2">
          {deck.cards.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-muted-foreground/70">
                  #{c.ordinal}
                </span>
                {c.totalReviews > 0 ? (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/80">
                    {c.lapses > 0 ? (
                      <Flame className="h-3 w-3 text-warning" aria-hidden />
                    ) : null}
                    <span>{c.repetition} streak · {c.intervalDays}d interval</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-primary">New</span>
                )}
              </div>
              <p className="mt-1 text-[14px] font-bold tracking-tight">{c.front}</p>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{c.back}</p>
              {c.hint ? (
                <p className="mt-1 text-[12px] italic text-muted-foreground/80">
                  Hint: {c.hint}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
            <AlertDialogDescription>
              All {total} cards and your review history will be permanently
              removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "primary" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-warning/10 text-warning"
      : tone === "success"
        ? "bg-success/10 text-success"
        : "bg-accent text-primary";
  const isWide = typeof value === "string" && value.length >= 3;
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3">
      <span
        className={`flex h-9 items-center justify-center rounded-full text-[15px] font-extrabold ${toneClass} ${isWide ? "px-3" : "w-9"}`}
      >
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function nextDue(deck: FlashcardDeckWithCards): string {
  const soonest = deck.cards
    .filter((c) => c.totalReviews > 0)
    .map((c) => new Date(c.dueAt).getTime())
    .sort((a, b) => a - b)[0];
  return soonest ? new Date(soonest).toISOString() : new Date().toISOString();
}
