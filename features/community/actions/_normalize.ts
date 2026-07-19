import type { CommunityNoteListItem, CommunityNoteStatus } from "../types";

interface RawRow {
  id: string;
  author_id: string;
  author_display_name?: string | null;
  subject_id: string;
  title: string;
  content: string;
  status: string;
  likes_count: number;
  bookmarks_count: number;
  created_at: string;
  subject: { name: string } | { name: string }[] | null;
}

interface Ctx {
  likedSet: Set<string>;
  /** author name overrides (rare — usually the row's own column is enough). */
  authorNames?: Map<string, string>;
}

const EXCERPT_MAX = 220;

function makeExcerpt(content: string): string {
  const stripped = content.replace(/\s+/g, " ").trim();
  if (stripped.length <= EXCERPT_MAX) return stripped;
  return stripped.slice(0, EXCERPT_MAX).trimEnd() + "…";
}

function toStatus(raw: string): CommunityNoteStatus {
  return raw === "approved" || raw === "rejected" ? raw : "pending";
}

export function toListItem(row: RawRow, ctx: Ctx): CommunityNoteListItem {
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
  const displayName =
    ctx.authorNames?.get(row.author_id) ??
    (row.author_display_name && row.author_display_name.trim().length > 0
      ? row.author_display_name
      : "Anonymous");

  return {
    id: row.id,
    authorId: row.author_id,
    authorDisplayName: displayName,
    subjectId: row.subject_id,
    subjectName: subject?.name ?? "—",
    title: row.title,
    excerpt: makeExcerpt(row.content),
    status: toStatus(row.status),
    likesCount: row.likes_count,
    bookmarksCount: row.bookmarks_count,
    hasLiked: ctx.likedSet.has(row.id),
    createdAt: row.created_at,
  };
}
