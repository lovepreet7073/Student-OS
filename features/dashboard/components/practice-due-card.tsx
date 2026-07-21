import Link from "next/link";
import { Flame, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listWeakCards } from "@/features/flashcards/actions/list-weak-cards";
import { listDueCards } from "@/features/flashcards/actions/list-due-cards";

/**
 * "Practice now" card on Today. Server-fetches the two most common
 * practice CTAs and picks the strongest one to hero. Order of
 * precedence:
 *
 *   1. Due flashcards (biggest routine wins)
 *   2. Weak cards (targeted revision)
 *   3. Silent — no practice due; render nothing.
 *
 * Renders null when the student has no decks at all, so a brand-new
 * student sees an empty Today above (streak) → below (tasks) without
 * a dead "practice 0 cards" box in the middle.
 */
export async function PracticeDueCard() {
  const [due, weak] = await Promise.all([listDueCards(60), listWeakCards(60)]);
  const dueCount = due.ok ? due.data.length : 0;
  const weakCount = weak.ok ? weak.data.length : 0;

  if (dueCount === 0 && weakCount === 0) return null;

  const primary =
    dueCount > 0
      ? {
          href: "/app/flashcards/inbox",
          label: `Review ${dueCount} card${dueCount === 1 ? "" : "s"} due`,
          icon: Flame,
          tone: "warning" as const,
          note: "Best time — spaced repetition works when you show up.",
        }
      : {
          href: "/app/flashcards/weak",
          label: `Drill ${weakCount} weak card${weakCount === 1 ? "" : "s"}`,
          icon: Play,
          tone: "primary" as const,
          note: "These slipped last time. Fifteen minutes fixes most of them.",
        };

  return (
    <section
      aria-label="Practice now"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Practice now
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
              primary.tone === "warning"
                ? "bg-warning/15 text-warning"
                : "bg-accent text-primary"
            }`}
          >
            <primary.icon className="h-6 w-6" strokeWidth={2} />
          </span>
          <div>
            <div className="text-[16px] font-extrabold tracking-tight">
              {primary.label}
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              {primary.note}
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={primary.href}>
            <Play className="h-4 w-4" aria-hidden />
            Start
          </Link>
        </Button>
      </div>
      {dueCount > 0 && weakCount > 0 ? (
        <div className="mt-3 border-t border-border pt-3 text-[12.5px]">
          <Link
            href="/app/flashcards/weak"
            className="font-bold text-primary underline-offset-2 hover:underline"
          >
            Also drill {weakCount} weak card{weakCount === 1 ? "" : "s"}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
