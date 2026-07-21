import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookText,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Layers,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { listRecentActivity } from "@/features/workspace/actions/list-recent-activity";
import type { WorkspaceEntityType } from "@/features/workspace/types";

/**
 * "Continue" card on Today — the top 3 things the student was last
 * looking at. Backed by `activity_events` where `action = 'opened'`.
 *
 * Renders null for a brand-new student (no opens yet) instead of a
 * placeholder — Today is opinionated about avoiding decorative cards.
 *
 * The very first item is the "hero" — bigger, coloured, with a "Resume"
 * button. Items 2 and 3 render as compact rows below so a returning
 * student can jump to what they were doing yesterday in one tap.
 */

interface Meta {
  hrefFor: (entityId: string) => string;
  label: string;
  icon: LucideIcon;
  toneClass: string;
}

const META: Record<WorkspaceEntityType, Meta> = {
  note: {
    hrefFor: (id) => `/app/notes/${id}`,
    label: "Note",
    icon: BookText,
    toneClass: "bg-accent text-primary",
  },
  file: {
    hrefFor: (id) => `/app/library/${id}`,
    label: "File",
    icon: FileText,
    toneClass: "bg-brand-accent/15 text-brand-accent",
  },
  task: {
    hrefFor: () => "/app/tasks",
    label: "Task",
    icon: ClipboardList,
    toneClass: "bg-warning/15 text-warning",
  },
  quiz: {
    hrefFor: (id) => `/app/study/${id}`,
    label: "Quiz",
    icon: Sparkles,
    toneClass: "bg-success/15 text-success",
  },
  study_plan: {
    hrefFor: (id) => `/app/planner/${id}`,
    label: "Study plan",
    icon: Sparkles,
    toneClass: "bg-info/15 text-info",
  },
  test_evaluation: {
    hrefFor: (id) => `/app/tests/${id}`,
    label: "Test eval",
    icon: ClipboardCheck,
    toneClass: "bg-danger/15 text-danger",
  },
  community_note: {
    hrefFor: (id) => `/app/community/${id}`,
    label: "Community",
    icon: Users,
    toneClass: "bg-brand-accent/15 text-brand-accent",
  },
  flashcard_deck: {
    hrefFor: (id) => `/app/flashcards/${id}`,
    label: "Deck",
    icon: Layers,
    toneClass: "bg-accent text-primary",
  },
};

export async function ContinueCard() {
  const result = await listRecentActivity({ action: "opened", limit: 3 });
  if (!result.ok) return null;
  const items = result.data;
  if (items.length === 0) return null;

  const [hero, ...rest] = items;
  const heroMeta = META[hero.entityType];
  const HeroIcon = heroMeta.icon;

  return (
    <section
      aria-label="Continue where you left off"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Continue
      </div>

      <Link
        href={heroMeta.hrefFor(hero.entityId)}
        className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
            heroMeta.toneClass,
          )}
        >
          <HeroIcon className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
            <span>{heroMeta.label}</span>
            <span className="text-[11px] font-semibold text-muted-foreground/70">
              {formatRelativeTime(hero.createdAt)}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[15px] font-extrabold tracking-tight">
            {hero.title || "Untitled"}
          </div>
        </div>
        <span className="hidden flex-shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground sm:flex">
          <Play className="h-3.5 w-3.5" aria-hidden />
          Resume
        </span>
        <ChevronRight
          className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70 sm:hidden"
          aria-hidden
        />
      </Link>

      {rest.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
          {rest.map((item) => {
            const meta = META[item.entityType];
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <Link
                  href={meta.hrefFor(item.entityId)}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md",
                      meta.toneClass,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {item.title || "Untitled"}
                  </span>
                  <span className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground/70">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
