import Link from "next/link";
import {
  BookOpen,
  BookText,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatRelativeTime } from "@/lib/format-date";

import type { ActivityEvent, WorkspaceEntityType } from "../types";

interface Props {
  events: ActivityEvent[];
  emptyKey: "opened" | "uploaded";
}

const ENTITY_META: Record<
  WorkspaceEntityType,
  { icon: typeof BookText; hrefBuilder: (id: string) => string; tone: string }
> = {
  note: {
    icon: BookText,
    hrefBuilder: (id) => `/app/notes/${id}`,
    tone: "bg-primary/10 text-primary",
  },
  file: {
    icon: FileText,
    hrefBuilder: (id) => `/app/library/${id}`,
    tone: "bg-brand-accent/12 text-brand-accent",
  },
  task: {
    icon: ClipboardList,
    hrefBuilder: () => "/app/tasks",
    tone: "bg-warning/15 text-warning",
  },
  quiz: {
    icon: BookOpen,
    hrefBuilder: (id) => `/app/study/${id}`,
    tone: "bg-success/12 text-success",
  },
  study_plan: {
    icon: CalendarClock,
    hrefBuilder: (id) => `/app/planner/${id}`,
    tone: "bg-primary/10 text-primary",
  },
  test_evaluation: {
    icon: ClipboardCheck,
    hrefBuilder: (id) => `/app/tests/${id}`,
    tone: "bg-danger/12 text-danger",
  },
  community_note: {
    icon: Users,
    hrefBuilder: (id) => `/app/community/${id}`,
    tone: "bg-brand-accent/12 text-brand-accent",
  },
};

export async function RecentActivityList({ events, emptyKey }: Props) {
  const t = await getTranslations("workspace.activity");

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
        <div className="text-[13.5px] font-bold">{t(`${emptyKey}Empty.title`)}</div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {t(`${emptyKey}Empty.description`)}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((e) => {
        const meta = ENTITY_META[e.entityType];
        const href = meta.hrefBuilder(e.entityId);
        return (
          <li key={e.id}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                aria-hidden
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${meta.tone}`}
              >
                <meta.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">
                  {e.title || t(`type.${e.entityType}`)}
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  {t(`type.${e.entityType}`)} · {formatRelativeTime(e.createdAt)}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
