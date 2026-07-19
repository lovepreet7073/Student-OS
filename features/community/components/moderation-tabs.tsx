"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface Props {
  pendingCount: number;
  reportedCount: number;
}

/**
 * Two-tab switcher on /app/community/moderation. State lives in the URL so a
 * teacher can bookmark or share a link to a specific queue view. Rendering
 * stays server-side; this component is client-only so it can read searchParams.
 */
export function ModerationTabs({ pendingCount, reportedCount }: Props) {
  const params = useSearchParams();
  const active = params.get("tab") === "reported" ? "reported" : "pending";

  return (
    <div
      role="tablist"
      aria-label="Moderation queues"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
    >
      <Tab active={active === "pending"} href="/app/community/moderation" label="Pending" count={pendingCount} />
      <Tab
        active={active === "reported"}
        href="/app/community/moderation?tab=reported"
        label="Reported"
        count={reportedCount}
      />
    </div>
  );
}

function Tab({
  active,
  href,
  label,
  count,
}: {
  active: boolean;
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {count > 0 ? (
        <span
          className={cn(
            "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-extrabold",
            active ? "bg-primary-foreground text-primary" : "bg-secondary text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
