import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-date";

import type { NoteListItem } from "../types";
import { BookmarkToggleButton } from "./bookmark-toggle-button";
import { DeleteNoteDialog } from "./delete-note-dialog";

interface NoteDetailViewProps {
  note: NoteListItem;
}

export function NoteDetailView({ note }: NoteDetailViewProps) {
  return (
    <article className="flex flex-col gap-6">
      <nav aria-label="Back to notes" className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back to notes">
          <Link href="/app/notes">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <span className="text-[13px] font-bold text-muted-foreground">
          {note.subjectName} · updated {formatRelativeTime(note.updatedAt)}
        </span>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <BookmarkToggleButton noteId={note.id} isBookmarked={note.isBookmarked} />
          <Button asChild variant="outline" size="icon" aria-label="Edit note">
            <Link href={`/app/notes/${note.id}/edit`}>
              <Pencil className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </Link>
          </Button>
          <DeleteNoteDialog noteId={note.id} noteTitle={note.title} />
        </div>
      </header>

      <section
        className="rounded-xl border border-border bg-card p-5 sm:p-7"
        aria-label="Note content"
      >
        {note.content.trim().length === 0 ? (
          <p className="text-sm text-muted-foreground">This note is empty.</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-[14.5px] leading-relaxed text-foreground">
            {note.content}
          </pre>
        )}
      </section>
    </article>
  );
}
