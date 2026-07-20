import {
  BookText,
  ClipboardList,
  FileText,
  Flame,
  GraduationCap,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { Badge, BadgeCategory } from "../lib/achievements";

const CATEGORY_META: Record<
  BadgeCategory,
  { icon: typeof Trophy; ring: string; bg: string; text: string }
> = {
  streak: {
    icon: Flame,
    ring: "border-warning/40",
    bg: "bg-warning/15",
    text: "text-warning",
  },
  notes: {
    icon: BookText,
    ring: "border-primary/40",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  quizzes: {
    icon: Sparkles,
    ring: "border-success/40",
    bg: "bg-success/12",
    text: "text-success",
  },
  files: {
    icon: FileText,
    ring: "border-info/40",
    bg: "bg-info/12",
    text: "text-info",
  },
  tests: {
    icon: GraduationCap,
    ring: "border-danger/40",
    bg: "bg-danger/12",
    text: "text-danger",
  },
  community: {
    icon: Users,
    ring: "border-brand-accent/40",
    bg: "bg-brand-accent/12",
    text: "text-brand-accent",
  },
  tasks: {
    icon: ClipboardList,
    ring: "border-warning/40",
    bg: "bg-warning/15",
    text: "text-warning",
  },
};

interface AchievementCardProps {
  badge: Badge;
}

export function AchievementCard({ badge }: AchievementCardProps) {
  const meta = CATEGORY_META[badge.category];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-3.5 transition-colors",
        badge.earned ? meta.ring : "border-border/60 opacity-70",
      )}
      aria-label={`${badge.label} — ${badge.earned ? "earned" : `progress ${badge.progress}%`}`}
    >
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            badge.earned ? `${meta.bg} ${meta.text}` : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        {badge.earned ? (
          <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-success">
            Earned
          </span>
        ) : (
          <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-muted-foreground">
            {badge.metric}/{badge.threshold}
          </span>
        )}
      </div>
      <div>
        <div className="text-[13.5px] font-extrabold tracking-tight">{badge.label}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
          {badge.description}
        </div>
      </div>
      {!badge.earned ? (
        <div
          role="progressbar"
          aria-valuenow={badge.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-0.5 h-1 rounded-full bg-secondary"
        >
          <div
            className={cn("h-full rounded-full", meta.bg)}
            style={{ width: `${badge.progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
