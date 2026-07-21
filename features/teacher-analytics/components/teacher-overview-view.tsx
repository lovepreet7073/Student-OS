import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Trophy,
  XCircle,
} from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import type { TeacherAnalyticsOverview } from "../types";

interface Props {
  overview: TeacherAnalyticsOverview;
  boardShort: string;
  className: string;
  mediumName: string;
}

/**
 * Server-rendered analytics view. Split into three sections:
 *   1. Six KPI stat cards (approved/rejected totals + week + pending + reports)
 *   2. Top contributors leaderboard (peers producing the most approved shares)
 *   3. Recent moderation activity (the last 20 actions this teacher took)
 *
 * The scope banner at the top makes it clear these numbers describe the
 * teacher's board × class × medium, not the whole platform.
 */
export function TeacherOverviewView({
  overview,
  boardShort,
  className,
  mediumName,
}: Props) {
  const { stats, recentActivity, topContributors } = overview;
  const approvalRate =
    stats.approvedTotal + stats.rejectedTotal === 0
      ? null
      : Math.round(
          (stats.approvedTotal /
            (stats.approvedTotal + stats.rejectedTotal)) *
            100,
        );

  return (
    <div className="mx-auto max-w-[1140px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <header className="mb-5 flex flex-col gap-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Teacher · {boardShort} · Class {className} · {mediumName}
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
          Analytics
        </h1>
        <p className="text-[13.5px] text-muted-foreground">
          Your moderation activity and the community in your scope.
        </p>
      </header>

      <section
        aria-label="Stats"
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatCard
          label="Approved"
          value={stats.approvedTotal}
          hint={`+${stats.approvedThisWeek} this week`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Rejected"
          value={stats.rejectedTotal}
          hint={`+${stats.rejectedThisWeek} this week`}
          icon={XCircle}
          tone="danger"
        />
        <StatCard
          label="Approval rate"
          value={approvalRate === null ? "—" : `${approvalRate}%`}
          hint={approvalRate === null ? "No decisions yet" : "All time"}
          icon={Trophy}
          tone="primary"
        />
        <StatCard
          label="Pending queue"
          value={stats.pendingInScope}
          hint="Waiting for review"
          icon={Clock}
          tone="warning"
          href="/app/community/moderation"
        />
        <StatCard
          label="Open reports"
          value={stats.reportsOpen}
          hint="Need attention"
          icon={Flag}
          tone="warning"
          href="/app/community/moderation?tab=reports"
        />
        <StatCard
          label="Contributors"
          value={topContributors.length}
          hint="In your scope"
          icon={Trophy}
          tone="info"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Top contributors">
          <SectionHeader title="Top contributors" />
          {topContributors.length === 0 ? (
            <EmptyRow message="No approved shares yet in your scope." />
          ) : (
            <ol className="space-y-2">
              {topContributors.map((c, i) => (
                <li
                  key={c.authorId}
                  className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-extrabold text-primary tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/app/community/authors/${c.authorId}`}
                      className="truncate text-[14px] font-bold tracking-tight hover:text-primary"
                    >
                      {c.displayName}
                    </Link>
                    <span className="text-[12px] text-muted-foreground">
                      {c.approvedCount} approved{" "}
                      {c.approvedCount === 1 ? "share" : "shares"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-label="Recent moderation">
          <SectionHeader title="Recent moderation" />
          {recentActivity.length === 0 ? (
            <EmptyRow message="You haven't moderated anything yet." />
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/app/community/${a.id}`}
                    className="flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        a.status === "approved"
                          ? "bg-success/12 text-success"
                          : "bg-danger/12 text-danger",
                      )}
                    >
                      {a.status === "approved" ? (
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <XCircle className="h-4 w-4" strokeWidth={2} />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          {a.subjectName}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground/70">
                          {formatRelativeTime(a.moderatedAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[14px] font-bold tracking-tight">
                        {a.noteTitle}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        by {a.authorDisplayName}
                      </div>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 flex-shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof CheckCircle2;
  tone: "success" | "danger" | "warning" | "primary" | "info";
  href?: string;
}) {
  const toneClass = TONE_CLASSES[tone];
  const body = (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            toneClass,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-[24px] font-extrabold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[11.5px] text-muted-foreground">{hint}</div>
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {body}
      </Link>
    );
  }
  return body;
}

const TONE_CLASSES: Record<string, string> = {
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
  warning: "bg-warning/15 text-warning",
  primary: "bg-accent text-primary",
  info: "bg-info/12 text-info",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
      {title}
    </h2>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border p-4 text-center text-[13px] text-muted-foreground">
      {message}
    </p>
  );
}
