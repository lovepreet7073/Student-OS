import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BookOpen, ClipboardCheck, Layers } from "lucide-react";

import { cn } from "@/lib/utils";

export type PracticeView = "flashcards" | "quizzes" | "tests";

interface Props {
  active: PracticeView;
}

interface Tab {
  key: PracticeView;
  label: string;
  href: string;
  icon: LucideIcon;
  hint: string;
}

/**
 * Practice hub tab strip. Server-rendered plain <Link>s — every tab is
 * a shareable URL, active state is authoritative from the URL, no
 * client state needed.
 *
 * Flashcards is the default view because spaced repetition is the
 * most-used practice mode. Quizzes is the second-most-used, Tests
 * (paper-scanning) the least frequent.
 */
export function PracticeViewTabs({ active }: Props) {
  const tabs: Tab[] = [
    {
      key: "flashcards",
      label: "Flashcards",
      hint: "Spaced repetition",
      href: "/app/practice",
      icon: Layers,
    },
    {
      key: "quizzes",
      label: "Quizzes",
      hint: "AI-generated MCQs",
      href: "/app/practice?view=quizzes",
      icon: BookOpen,
    },
    {
      key: "tests",
      label: "Test Evals",
      hint: "Grade paper tests",
      href: "/app/practice?view=tests",
      icon: ClipboardCheck,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Practice mode"
      className="flex gap-1 overflow-x-auto rounded-md border border-border bg-card p-1"
    >
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            role="tab"
            aria-selected={isActive}
            href={t.href}
            scroll={false}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-2 text-[13px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" aria-hidden />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
