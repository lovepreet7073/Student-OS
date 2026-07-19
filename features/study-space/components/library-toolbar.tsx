"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Bookmark, Search, X } from "lucide-react";

import type { Subject } from "@/features/academic-identity/types";
import { cn } from "@/lib/utils";

import type { Chapter } from "../types";

interface LibraryToolbarProps {
  subjects: Subject[];
  chapters: Chapter[];
}

/**
 * URL-synced filters:
 *   ?subject=<uuid>&chapter=<uuid>&bookmarked=1&q=<search>
 * router.replace() — no history bloat.
 */
export function LibraryToolbar({ subjects, chapters }: LibraryToolbarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const subjectId = params.get("subject");
  const chapterId = params.get("chapter");
  const bookmarked = params.get("bookmarked") === "1";
  const search = params.get("q") ?? "";

  const scopedChapters = subjectId
    ? chapters.filter((c) => c.subjectId === subjectId)
    : [];

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `/app/library?${qs}` : "/app/library", { scroll: false });
    },
    [params, router],
  );

  return (
    <div className="flex flex-col gap-3.5">
      {/* Search */}
      <div className="flex h-[46px] items-center gap-2.5 rounded-md border border-border bg-card px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        <Search className="h-[19px] w-[19px] flex-shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setParam({ q: e.target.value || null })}
          placeholder="Search files"
          inputMode="search"
          enterKeyHint="search"
          aria-label="Search files"
          className="flex-1 border-none bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        {search.length > 0 ? (
          <button
            type="button"
            onClick={() => setParam({ q: null })}
            aria-label="Clear search"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Subject chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filter by subject"
      >
        <Chip
          label="All"
          active={!subjectId}
          onClick={() => setParam({ subject: null, chapter: null })}
        />
        {subjects.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            active={subjectId === s.id}
            onClick={() => setParam({ subject: s.id, chapter: null })}
          />
        ))}
        <BookmarkChip
          active={bookmarked}
          onClick={() => setParam({ bookmarked: bookmarked ? null : "1" })}
        />
      </div>

      {/* Chapter chips (only visible when a subject is selected AND has chapters) */}
      {subjectId && scopedChapters.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter by chapter"
        >
          <Chip
            label="All chapters"
            active={!chapterId}
            onClick={() => setParam({ chapter: null })}
            small
          />
          {scopedChapters.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={chapterId === c.id}
              onClick={() => setParam({ chapter: c.id })}
              small
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full font-bold transition-colors",
        small ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function BookmarkChip({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label="Bookmarked only"
      className={cn(
        "inline-flex h-10 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13.5px] font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <Bookmark className="h-3.5 w-3.5" fill={active ? "currentColor" : "none"} aria-hidden />
      Saved
    </button>
  );
}
