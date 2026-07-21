"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  BookText,
  ChevronRight,
  FileText,
  Search,
  Users,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import type { BookmarkItem, BookmarkOverview } from "../types";

interface BookmarksViewProps {
  overview: BookmarkOverview;
}

type Tab = "all" | "notes" | "files" | "community";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "files", label: "Files" },
  { key: "community", label: "Community" },
];

const KIND_META = {
  note: { icon: BookText, label: "Note", tone: "bg-accent text-primary" },
  file: {
    icon: FileText,
    label: "File",
    tone: "bg-brand-accent/12 text-brand-accent",
  },
  community_note: {
    icon: Users,
    label: "Shared",
    tone: "bg-info/12 text-info",
  },
} as const;

export function BookmarksView({ overview }: BookmarksViewProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const baseItems: BookmarkItem[] = useMemo(
    () =>
      tab === "all"
        ? [...overview.notes, ...overview.files, ...overview.community].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
        : tab === "notes"
          ? overview.notes
          : tab === "files"
            ? overview.files
            : overview.community,
    [tab, overview],
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return baseItems;
    return baseItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q),
    );
  }, [baseItems, query]);

  const countFor = (key: Tab): number =>
    key === "all"
      ? overview.totals.all
      : key === "notes"
        ? overview.totals.notes
        : key === "files"
          ? overview.totals.files
          : overview.totals.community;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:max-w-[1140px] lg:px-11 lg:pt-8">
      <header className="mb-5">
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
          Bookmarks
        </h1>
        <p className="mt-0.5 text-[13.5px] text-muted-foreground">
          Everything you saved to come back to.
        </p>
      </header>

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your bookmarks"
          enterKeyHint="search"
          className="pl-9 pr-9"
          aria-label="Search bookmarks"
        />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="Bookmark filters"
        className="mb-5 flex gap-1.5 overflow-x-auto rounded-md border border-border bg-card p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = countFor(t.key);
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-2 text-[13px] font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        query.trim().length > 0 ? (
          <EmptyState
            icon={Search}
            title={`No matches for "${query.trim()}"`}
            description="Try a shorter or different word."
          />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Nothing bookmarked yet"
            description="Tap the bookmark icon on any note, file, or community post to save it here."
          />
        )
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`}>
              <BookmarkRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookmarkRow({ item }: { item: BookmarkItem }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md",
          meta.tone,
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {meta.label}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground/70">
            {formatRelativeTime(item.updatedAt)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[15px] font-bold tracking-tight">
          {item.title}
        </div>
        <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {item.subtitle}
        </div>
      </div>
      <ChevronRight
        className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}
