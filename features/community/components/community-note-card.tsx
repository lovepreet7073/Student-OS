import Link from "next/link";
import { Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CommunityNoteListItem } from "../types";
import { CommunityLikeButton } from "./community-like-button";

interface Props {
  note: CommunityNoteListItem;
}

const TONES = [
  { color: "#E5533C", tint: "rgba(229, 83, 60, 0.12)" },
  { color: "#5B5FDB", tint: "rgba(91, 95, 219, 0.12)" },
  { color: "#E8A13A", tint: "rgba(232, 161, 58, 0.12)" },
  { color: "#2FB57C", tint: "rgba(47, 181, 124, 0.12)" },
  { color: "#8B5CF6", tint: "rgba(139, 92, 246, 0.12)" },
];

function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length]!;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function CommunityNoteCard({ note }: Props) {
  const tone = toneFor(note.subjectName);

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <Link
        href={`/app/community/${note.id}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Open ${note.title}`}
      />

      <div className="relative flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide"
          style={{ backgroundColor: tone.tint, color: tone.color }}
        >
          {note.subjectName}
        </span>
        {note.bookmarksCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Bookmark className="h-3 w-3" strokeWidth={2} />
            {note.bookmarksCount}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <h3 className="line-clamp-2 text-[15.5px] font-extrabold tracking-tight">
          {note.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
          {note.excerpt || "No preview available."}
        </p>
      </div>

      <div className="relative flex items-center justify-between pt-1">
        <Link
          href={`/app/community/authors/${note.authorId}`}
          className={cn(
            "relative z-10 flex items-center gap-2 rounded-full px-1 py-0.5 -ml-1 transition-colors",
            "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-[10px] font-extrabold text-primary"
          >
            {initials(note.authorDisplayName) || "?"}
          </span>
          <span className="text-[12px] font-bold text-muted-foreground">
            {note.authorDisplayName}
          </span>
        </Link>
        <div className="relative z-10">
          <CommunityLikeButton
            noteId={note.id}
            initialLiked={note.hasLiked}
            initialCount={note.likesCount}
            variant="compact"
          />
        </div>
      </div>
    </article>
  );
}
