import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BookText, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  active: "notes" | "files";
  notesCount: number;
  filesCount: number;
}

interface Tab {
  key: "notes" | "files";
  label: string;
  href: string;
  count: number;
  icon: LucideIcon;
}

/**
 * Server-rendered tab strip for the merged Library page (`/app/notes`).
 * Each tab is a plain <Link> so the URL is shareable and the active
 * state is authoritative (comes from the server, not client state).
 *
 * `?view=notes` is the default (falsy). `?view=files` shows uploaded
 * files. Keeping the notes URL as canonical avoids breaking every
 * existing link into the notes feature.
 */
export function LibraryViewTabs({ active, notesCount, filesCount }: Props) {
  const tabs: Tab[] = [
    {
      key: "notes",
      label: "Notes",
      href: "/app/notes",
      count: notesCount,
      icon: BookText,
    },
    {
      key: "files",
      label: "Files",
      href: "/app/notes?view=files",
      count: filesCount,
      icon: FileText,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Library view"
      className="inline-flex gap-1 rounded-md border border-border bg-card p-1"
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
              "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" aria-hidden />
            <span>{t.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {t.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
