import Link from "next/link";
import {
  BookOpen,
  BookText,
  Bookmark,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  Trophy,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { WorkspaceOverview } from "../types";

interface Props {
  overview: WorkspaceOverview;
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  brand:   "bg-brand-accent/12 text-brand-accent",
  info:    "bg-info/12 text-info",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger:  "bg-danger/12 text-danger",
} as const;

export async function CategoryGrid({ overview }: Props) {
  const t = await getTranslations("workspace.categories");

  const items = [
    {
      key: "calendar",
      icon: CalendarClock,
      href: "/app/calendar",
      count: 0,
      unitKey: "viewAgenda",
      tone: "warning" as const,
    },
    {
      key: "syllabus",
      icon: GraduationCap,
      href: "/app/syllabus",
      count: 0,
      unitKey: "browse",
      tone: "info" as const,
    },
    {
      key: "notes",
      icon: BookText,
      href: "/app/notes",
      count: overview.notes,
      unitKey: "notes",
      tone: "primary" as const,
    },
    {
      key: "files",
      icon: FileText,
      href: "/app/library",
      count: overview.files,
      unitKey: "files",
      tone: "brand" as const,
    },
    {
      key: "tasks",
      icon: ClipboardList,
      href: "/app/tasks",
      count: overview.tasks.total,
      badge: overview.tasks.openToday > 0 ? `${overview.tasks.openToday} today` : null,
      unitKey: "tasks",
      tone: "warning" as const,
    },
    {
      key: "bookmarks",
      icon: Bookmark,
      href: "/app/bookmarks",
      count: overview.bookmarkedTotal,
      unitKey: "bookmarks",
      tone: "info" as const,
    },
    {
      key: "quizzes",
      icon: BookOpen,
      href: "/app/study",
      count: overview.quizzes,
      unitKey: "quizzes",
      tone: "success" as const,
    },
    {
      key: "flashcards",
      icon: Layers,
      href: "/app/flashcards",
      count: overview.flashcardDecks,
      badge:
        overview.flashcardsDueToday > 0
          ? `${overview.flashcardsDueToday} due`
          : null,
      unitKey: "decks",
      tone: "primary" as const,
    },
    {
      key: "chat",
      icon: MessageSquare,
      href: "/app/chat",
      count: overview.chatConversations,
      unitKey: "chats",
      tone: "info" as const,
    },
    {
      key: "plan",
      icon: CalendarClock,
      href: "/app/planner",
      count: overview.studyPlanActive ? 1 : 0,
      badge: overview.studyPlanActive ? t("planActive") : t("planNone"),
      unitKey: overview.studyPlanActive ? "plan_singular" : "plan_none",
      tone: "primary" as const,
    },
    {
      key: "tests",
      icon: ClipboardCheck,
      href: "/app/tests",
      count: overview.testEvaluations,
      unitKey: "tests",
      tone: "danger" as const,
    },
    {
      key: "community",
      icon: Users,
      href: "/app/community",
      count: overview.sharedToCommunity,
      unitKey: "sharedNotes",
      tone: "brand" as const,
    },
    {
      key: "achievements",
      icon: Trophy,
      href: "/app/achievements",
      count: 0,
      unitKey: "badges",
      tone: "warning" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex items-start justify-between">
            <span
              aria-hidden
              className={`flex h-10 w-10 items-center justify-center rounded-md ${TONES[item.tone]}`}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            {item.badge ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {item.badge}
              </span>
            ) : null}
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight">
              {t(item.key)}
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
              {item.count} {t(item.unitKey)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
