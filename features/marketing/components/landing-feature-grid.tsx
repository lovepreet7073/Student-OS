import {
  BookOpen,
  BookOpenCheck,
  BrainCircuit,
  CalendarClock,
  ClipboardList,
  Layers,
  ListChecks,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";

import type { Audience } from "../types";

interface FeatureTile {
  key: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
  accent: "primary" | "brand" | "info" | "success" | "warning" | "danger";
}

const STUDENT_TILES: FeatureTile[] = [
  { key: "planner",   icon: Sparkles,       title: "AI Study Planner",  description: "Auto-builds your day around exams.",          accent: "primary" },
  { key: "notes",     icon: BookOpen,       title: "Notes Library",     description: "Every subject, neatly organised.",             accent: "brand"   },
  { key: "papers",    icon: ScrollText,     title: "Previous Papers",   description: "Board-wise, searchable and sorted.",           accent: "info"    },
  { key: "flash",     icon: Layers,         title: "Flashcards",        description: "Spaced repetition that sticks.",               accent: "success" },
  { key: "countdown", icon: CalendarClock,  title: "Exam Countdown",    description: "Never miss a deadline again.",                 accent: "warning" },
  { key: "summaries", icon: BrainCircuit,   title: "AI Summaries",      description: "Long notes into crisp cards.",                 accent: "danger"  },
];

const TEACHER_TILES: FeatureTile[] = [
  { key: "planner",   icon: Sparkles,       title: "AI Lesson Planner", description: "Draft lessons that match your syllabus.",      accent: "primary" },
  { key: "notes",     icon: BookOpen,       title: "Class Notes",       description: "Share polished notes with every batch.",       accent: "brand"   },
  { key: "papers",    icon: ClipboardList,  title: "Question Banks",    description: "Curate practice sets in seconds.",             accent: "info"    },
  { key: "grader",    icon: BookOpenCheck,  title: "AI Test Grading",   description: "Paper tests graded with per-answer feedback.", accent: "success" },
  { key: "students",  icon: Users,          title: "Student Progress",  description: "See who's on track — and who needs a nudge.",  accent: "warning" },
  { key: "summaries", icon: ListChecks,     title: "AI Summaries",      description: "Long chapters into crisp handouts.",           accent: "danger"  },
];

const ACCENT_STYLES: Record<FeatureTile["accent"], string> = {
  primary: "bg-primary/10 text-primary",
  brand:   "bg-brand-accent/12 text-brand-accent",
  info:    "bg-info/12 text-info",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger:  "bg-danger/12 text-danger",
};

interface LandingFeatureGridProps {
  audience: Audience;
}

/**
 * Six-up feature tiles from deck slide 4. The set is different for students vs
 * teachers so the strengths shown match who's reading.
 */
export function LandingFeatureGrid({ audience }: LandingFeatureGridProps) {
  const tiles = audience === "teacher" ? TEACHER_TILES : STUDENT_TILES;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
        >
          <span
            aria-hidden
            className={`flex h-11 w-11 items-center justify-center rounded-lg ${ACCENT_STYLES[tile.accent]}`}
          >
            <tile.icon className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight">{tile.title}</div>
            <div className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {tile.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
