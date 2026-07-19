import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-date";

import type { CommunityNoteDetail } from "../types";
import { CommunityBookmarkButton } from "./community-bookmark-button";
import { CommunityLikeButton } from "./community-like-button";
import { ReportButton } from "./report-button";

interface Props {
  note: CommunityNoteDetail;
}

function StatusBanner({ note }: { note: CommunityNoteDetail }) {
  if (note.status === "approved") return null;

  if (note.status === "pending") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-[13px] text-warning-foreground/90"
      >
        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" strokeWidth={2} aria-hidden />
        <div>
          <div className="font-bold">Waiting on a teacher review</div>
          <div className="mt-0.5 text-muted-foreground">
            Only you and the moderators can see this while it's pending. Peers see it once a teacher approves.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-[13px]"
    >
      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" strokeWidth={2} aria-hidden />
      <div>
        <div className="font-bold text-danger">This note was rejected</div>
        {note.rejectionReason ? (
          <div className="mt-0.5 text-muted-foreground">
            Reason: {note.rejectionReason}
          </div>
        ) : (
          <div className="mt-0.5 text-muted-foreground">
            The moderator didn't leave a reason.
          </div>
        )}
      </div>
    </div>
  );
}

export function CommunityDetailView({ note }: Props) {
  return (
    <article className="flex flex-col gap-6">
      <nav aria-label="Back to community" className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back to community">
          <Link href="/app/community">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <span className="text-[13px] font-bold text-muted-foreground">
          {note.subjectName} · shared {formatRelativeTime(note.createdAt)}
        </span>
        {note.status === "approved" ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-success"
            aria-label="Approved"
          >
            <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
            Approved
          </span>
        ) : null}
      </nav>

      <StatusBanner note={note} />

      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-[26px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
          {note.title}
        </h1>
        <Link
          href={`/app/community/authors/${note.authorId}`}
          className="flex w-fit items-center gap-2 rounded-full px-1 py-0.5 -ml-1 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-[11px] font-extrabold text-primary"
          >
            {note.authorDisplayName
              .split(/\s+/)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase() ?? "")
              .join("") || "?"}
          </span>
          <span>{note.authorDisplayName}</span>
        </Link>

        {note.status === "approved" ? (
          <div className="flex flex-wrap items-center gap-2">
            <CommunityLikeButton
              noteId={note.id}
              initialLiked={note.hasLiked}
              initialCount={note.likesCount}
              variant="expanded"
            />
            <CommunityBookmarkButton
              noteId={note.id}
              initialBookmarked={note.hasBookmarked}
            />
            {!note.isOwn ? <ReportButton noteId={note.id} /> : null}
          </div>
        ) : null}
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
