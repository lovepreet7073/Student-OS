import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BookText,
  Bookmark,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import type { WorkspaceOverview } from "../types";

interface Props {
  overview: WorkspaceOverview;
}

/**
 * Intent-grouped workspace grid. Instead of dumping every feature into a
 * flat alphabetized wall of tiles (Module 15 v1) — which forced students
 * to know feature names before they could find them — we now cluster by
 * *what the student is trying to do*:
 *
 *   1. Study material — the raw content they own
 *   2. Practice       — active-recall + AI tutoring
 *   3. Plan           — the "when" tools
 *   4. Progress       — social + gamification + product help
 *
 * Each tile carries a short one-line description so the intent is
 * legible before the student clicks in.
 */
type Tone = "primary" | "brand" | "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  brand: "bg-brand-accent/12 text-brand-accent",
  info: "bg-info/12 text-info",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
};

interface Tile {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  count: number | string | null;
  badge?: string | null;
}

export function CategoryGrid({ overview }: Props) {
  const studyMaterial: Tile[] = [
    {
      key: "notes",
      title: "Notes",
      description: "Write, search, and organize your own notes.",
      href: "/app/notes",
      icon: BookText,
      tone: "primary",
      count: overview.notes,
    },
    {
      key: "library",
      title: "Files",
      description: "PDFs and photos in your Library. AI can read them.",
      href: "/app/notes?view=files",
      icon: FileText,
      tone: "brand",
      count: overview.files,
    },
    {
      key: "syllabus",
      title: "Syllabus",
      description: "Browse every chapter for your class.",
      href: "/app/syllabus",
      icon: GraduationCap,
      tone: "info",
      count: null,
    },
    {
      key: "bookmarks",
      title: "Bookmarks",
      description: "Everything you saved — notes, files, community.",
      href: "/app/bookmarks",
      icon: Bookmark,
      tone: "info",
      count: overview.bookmarkedTotal,
    },
  ];

  const practice: Tile[] = [
    {
      key: "flashcards",
      title: "Flashcards",
      description: "Spaced-repetition decks. Review the hard ones.",
      href: "/app/practice",
      icon: Layers,
      tone: "primary",
      count: overview.flashcardDecks,
      badge:
        overview.flashcardsDueToday > 0
          ? `${overview.flashcardsDueToday} due`
          : null,
    },
    {
      key: "study",
      title: "Quizzes",
      description: "Generate a quick quiz on any topic.",
      href: "/app/practice?view=quizzes",
      icon: BookOpen,
      tone: "success",
      count: overview.quizzes,
    },
    {
      key: "tests",
      title: "Test Evaluations",
      description: "Snap paper answers → AI marks them.",
      href: "/app/practice?view=tests",
      icon: ClipboardCheck,
      tone: "danger",
      count: overview.testEvaluations,
    },
    {
      key: "chat",
      title: "AI Study Chat",
      description: "Ask any subject question. Multi-turn tutor.",
      href: "/app/chat",
      icon: MessageSquare,
      tone: "info",
      count: overview.chatConversations,
    },
  ];

  const plan: Tile[] = [
    {
      key: "tasks",
      title: "Tasks",
      description: "Your to-do list with due dates.",
      href: "/app/tasks",
      icon: ClipboardList,
      tone: "warning",
      count: overview.tasks.total,
      badge: overview.tasks.openToday > 0 ? `${overview.tasks.openToday} today` : null,
    },
    {
      key: "planner",
      title: "AI Study Planner",
      description: "AI drafts a 60-day plan for you.",
      href: "/app/planner",
      icon: Sparkles,
      tone: "primary",
      count: overview.studyPlanActive ? "Active" : null,
    },
    {
      key: "calendar",
      title: "Calendar",
      description: "Every task, exam, and study session on one agenda.",
      href: "/app/calendar",
      icon: CalendarClock,
      tone: "warning",
      count: null,
    },
  ];

  const progress: Tile[] = [
    {
      key: "community",
      title: "Community",
      description: "Read peer notes. Share your best ones.",
      href: "/app/community",
      icon: Users,
      tone: "brand",
      count: overview.sharedToCommunity,
    },
    {
      key: "achievements",
      title: "Achievements",
      description: "Streak, badges, and milestones.",
      href: "/app/achievements",
      icon: Trophy,
      tone: "warning",
      count: null,
    },
    {
      key: "help",
      title: "Helper",
      description: "How do I use StudyOS? Ask here.",
      href: "/app/help",
      icon: HelpCircle,
      tone: "info",
      count: null,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <TileSection
        title="Study material"
        description="Your content — read, save, and organise."
        tiles={studyMaterial}
      />
      <TileSection
        title="Practice"
        description="Active recall and AI tutoring."
        tiles={practice}
      />
      <TileSection
        title="Plan"
        description="Deadlines, sessions, and daily rhythm."
        tiles={plan}
      />
      <TileSection
        title="Progress"
        description="Social, streaks, and help."
        tiles={progress}
      />
    </div>
  );
}

function TileSection({
  title,
  description,
  tiles,
}: {
  title: string;
  description: string;
  tiles: Tile[];
}) {
  return (
    <section aria-label={title}>
      <div className="mb-3">
        <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
        <p className="text-[12.5px] text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                aria-hidden
                className={`flex h-10 w-10 items-center justify-center rounded-md ${TONES[tile.tone]}`}
              >
                <tile.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              {tile.badge ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  {tile.badge}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-extrabold tracking-tight">
                  {tile.title}
                </span>
                {tile.count !== null ? (
                  <span className="text-[12px] font-bold text-muted-foreground">
                    {tile.count}
                  </span>
                ) : null}
              </div>
              <p className="text-[12px] leading-snug text-muted-foreground">
                {tile.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
