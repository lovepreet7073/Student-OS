"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Check, HelpCircle, PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { reviewCard } from "../actions/review-card";
import type { Flashcard, ReviewQuality } from "../types";

interface ReviewSessionProps {
  /**
   * Title shown on the session-complete screen. For a single deck this is
   * the deck's title; for the cross-deck inbox pass "Review inbox".
   */
  deckTitle: string;
  cards: Flashcard[];
  /**
   * Where the top-nav exit button and the "back" button on the finish
   * screen go. Defaults to the flashcards index. Per-deck sessions pass
   * `/app/flashcards/{deckId}`.
   */
  exitHref?: string;
  exitLabel?: string;
}

/**
 * A single studying pass over the cards that are currently due or new.
 *
 * State machine per card:
 *   1. "prompt"  — front is shown, "Show answer" reveals the back
 *   2. "answer"  — back is shown, four SM-2 rating buttons enabled
 *   3. server persists the review, we advance to the next card
 *
 * We snapshot the queue when the session starts. If a card comes back due
 * during the session (e.g. student tapped "Again"), we re-append it to the
 * end of the queue so the loop terminates deterministically.
 */
export function ReviewSession({
  deckTitle,
  cards,
  exitHref = "/app/flashcards",
  exitLabel = "Back to deck",
}: ReviewSessionProps) {
  const router = useRouter();

  const initialQueue = useMemo(() => cards.map((c) => c.id), [cards]);
  const cardsById = useMemo(
    () => new Map(cards.map((c) => [c.id, c])),
    [cards],
  );

  const [queue, setQueue] = useState<string[]>(initialQueue);
  const [showBack, setShowBack] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isPending, startTransition] = useTransition();

  const currentId = queue[0];
  const current = currentId ? cardsById.get(currentId) : undefined;
  const done = !current;

  const progress = initialQueue.length - queue.length;

  function onRate(quality: ReviewQuality) {
    if (!current) return;
    // Optimistically advance so the UI stays responsive.
    setTally((t) => ({ ...t, [quality]: t[quality] + 1 }));
    setQueue((q) => {
      const [head, ...rest] = q;
      if (quality === "again" && head) return [...rest, head];
      return rest;
    });
    setShowBack(false);
    setShowHint(false);

    startTransition(async () => {
      const res = await reviewCard({ cardId: current.id, quality });
      if (!res.ok) {
        toast.error(res.error.message);
      }
    });
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-5 px-5 pb-10 pt-10 text-center sm:px-7 lg:px-11">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight">
          Session complete
        </h1>
        <p className="text-[14px] text-muted-foreground">
          You reviewed {initialQueue.length}{" "}
          {initialQueue.length === 1 ? "card" : "cards"} in {deckTitle}.
        </p>
        <ul className="w-full space-y-1 rounded-lg border border-border bg-card p-4 text-left text-[13.5px]">
          <TallyRow label="Again" value={tally.again} className="text-danger" />
          <TallyRow label="Hard" value={tally.hard} className="text-warning" />
          <TallyRow label="Good" value={tally.good} className="text-primary" />
          <TallyRow label="Easy" value={tally.easy} className="text-success" />
        </ul>
        <div className="flex w-full flex-col gap-2">
          <Button
            asChild
            fullWidth
            size="lg"
            onClick={() => router.refresh()}
          >
            <Link href={exitHref}>{exitLabel}</Link>
          </Button>
          <Button
            asChild
            fullWidth
            variant="outline"
            size="lg"
          >
            <Link href="/app/flashcards">All decks</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[720px] flex-col px-5 pb-6 pt-4 sm:px-7 lg:px-11">
      <nav
        aria-label="Exit review"
        className="mb-4 flex items-center justify-between gap-3"
      >
        <Button asChild variant="outline" size="icon" aria-label="Exit">
          <Link href={exitHref}>
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div
          className="text-[13px] font-bold tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {progress + 1} / {initialQueue.length}
        </div>
      </nav>

      <div
        aria-hidden
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{
            width: `${(progress / Math.max(1, initialQueue.length)) * 100}%`,
          }}
        />
      </div>

      <article
        aria-live="polite"
        className={cn(
          "flex flex-1 flex-col justify-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm",
          "min-h-[280px] sm:min-h-[320px]",
        )}
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {showBack ? "Answer" : "Question"}
        </div>
        <p className="text-[18px] font-bold leading-snug tracking-tight sm:text-[22px]">
          {current.front}
        </p>
        {!showBack && current.hint ? (
          showHint ? (
            <p className="text-[13.5px] italic text-muted-foreground">
              Hint: {current.hint}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-primary underline-offset-2 hover:underline"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
              Show hint
            </button>
          )
        ) : null}
        {showBack ? (
          <p className="text-[16px] leading-relaxed text-foreground/90 sm:text-[17px]">
            {current.back}
          </p>
        ) : null}
      </article>

      {!showBack ? (
        <div className="sticky bottom-0 mt-4 pb-[env(safe-area-inset-bottom)]">
          <Button
            size="lg"
            fullWidth
            onClick={() => setShowBack(true)}
          >
            <Check className="h-4 w-4" aria-hidden />
            Show answer
          </Button>
        </div>
      ) : (
        <div className="sticky bottom-0 mt-4 grid grid-cols-4 gap-2 pb-[env(safe-area-inset-bottom)]">
          <RatingButton
            label="Again"
            hint="<10m"
            onClick={() => onRate("again")}
            disabled={isPending}
            tone="danger"
          />
          <RatingButton
            label="Hard"
            hint={`${nextIntervalDays(current, "hard")}d`}
            onClick={() => onRate("hard")}
            disabled={isPending}
            tone="warning"
          />
          <RatingButton
            label="Good"
            hint={`${nextIntervalDays(current, "good")}d`}
            onClick={() => onRate("good")}
            disabled={isPending}
            tone="primary"
          />
          <RatingButton
            label="Easy"
            hint={`${nextIntervalDays(current, "easy")}d`}
            onClick={() => onRate("easy")}
            disabled={isPending}
            tone="success"
          />
        </div>
      )}
    </div>
  );
}

function RatingButton({
  label,
  hint,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled: boolean;
  tone: "danger" | "warning" | "primary" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/40 text-danger hover:bg-danger/5"
      : tone === "warning"
        ? "border-warning/40 text-warning hover:bg-warning/5"
        : tone === "success"
          ? "border-success/40 text-success hover:bg-success/5"
          : "border-primary/40 text-primary hover:bg-primary/5";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-[64px] flex-col items-center justify-center gap-0.5 rounded-md border-2 bg-card font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        toneClass,
      )}
    >
      <span className="text-[14px]">{label}</span>
      <span className="text-[10.5px] font-semibold opacity-70">{hint}</span>
    </button>
  );
}

function TallyRow({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className={cn("font-bold", className)}>{label}</span>
      <span className="tabular-nums font-semibold text-muted-foreground">
        {value}
      </span>
    </li>
  );
}

/**
 * Preview of the next interval each rating would set. Not a re-implementation
 * of SM-2 — a simplified projection so the buttons show a rough "1d / 6d /
 * 15d" cue, mirroring Anki's UX. The authoritative value is computed
 * server-side by `applySm2`.
 */
function nextIntervalDays(card: Flashcard, quality: ReviewQuality): number {
  if (quality === "again") return 1;
  if (card.repetition === 0) {
    if (quality === "hard") return 1;
    if (quality === "good") return 1;
    return 4;
  }
  if (card.repetition === 1) {
    if (quality === "hard") return 3;
    if (quality === "good") return 6;
    return 10;
  }
  const base = card.intervalDays * card.easeFactor;
  if (quality === "hard") return Math.max(1, Math.round(base * 0.7));
  if (quality === "good") return Math.max(1, Math.round(base));
  return Math.max(1, Math.round(base * 1.3));
}
