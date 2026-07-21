import Link from "next/link";

import { cn } from "@/lib/utils";

import type { TeacherActivityRange } from "../actions/get-daily-activity";

interface Props {
  current: TeacherActivityRange;
}

const OPTIONS: { key: TeacherActivityRange; label: string }[] = [
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "1 year" },
];

/**
 * Server-rendered toggle. Each option is a plain `<Link>` — clicking
 * navigates to `/app/teacher?range=X` which re-runs the page's server
 * data-fetch. No client JS, no fetch-inside-a-hook.
 */
export function TimeRangeToggle({ current }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Activity range"
      className="inline-flex gap-1 rounded-md border border-border bg-card p-1"
    >
      {OPTIONS.map((o) => {
        const active = current === o.key;
        return (
          <Link
            key={o.key}
            role="tab"
            aria-selected={active}
            href={`/app/teacher?range=${o.key}`}
            scroll={false}
            className={cn(
              "rounded-sm px-3 py-1 text-[12.5px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
