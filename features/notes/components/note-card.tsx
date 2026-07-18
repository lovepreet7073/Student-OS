import Link from "next/link";
import { Bookmark } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import { buildSnippet } from "../lib/snippet";
import type { NoteListItem } from "../types";

interface NoteCardProps {
  note: NoteListItem;
  tone: { color: string; tint: string };
}

export function NoteCard({ note, tone }: NoteCardProps) {
  const snippet = buildSnippet(note.content);
  const relative = formatRelativeTime(note.updatedAt);

  return (
    <Link
      href={`/app/notes/${note.id}`}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-colors",
        "hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-[12px] font-bold"
          style={{ color: tone.color }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: tone.color }}
          />
          {note.subjectName}
        </span>
        <Bookmark
          className={cn(
            "h-[18px] w-[18px]",
            note.isBookmarked ? "" : "text-muted-foreground",
          )}
          strokeWidth={1.8}
          fill={note.isBookmarked ? tone.color : "none"}
          stroke={note.isBookmarked ? tone.color : "currentColor"}
          aria-label={note.isBookmarked ? "Bookmarked" : undefined}
        />
      </div>
      <h3 className="text-base font-bold leading-tight tracking-tight text-foreground">
        {note.title}
      </h3>
      {snippet.length > 0 ? (
        <p className="text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
          {snippet}
        </p>
      ) : null}
      <div className="mt-0.5 text-xs font-semibold text-muted-foreground/80">{relative}</div>
    </Link>
  );
}
