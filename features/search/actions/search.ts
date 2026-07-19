"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { SearchHit, SearchResults } from "../types";

const PER_GROUP = 8;
const SNIPPET_MAX = 160;

/**
 * Global search across notes, study files, tasks, and community notes.
 * MVP uses ILIKE on the relevant text fields — cheap, correct, scales to
 * ~10k rows per user. When a table crosses that we'll swap the ILIKE for
 * `to_tsvector` (the GIN index on `notes` is already there — Module 4).
 *
 * Scope: personal content is restricted to the caller's own rows; community
 * results are scope-filtered to the same board × class × medium as everywhere
 * else on `/app/community`.
 */
export async function globalSearch(query: string): Promise<Result<SearchResults, ActionError>> {
  const q = query.trim();
  if (q.length < 2) {
    return ok({ query: q, notes: [], files: [], tasks: [], community: [], total: 0 });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const like = `%${q.replace(/[%_]/g, "\\$&")}%`;

  const [notes, files, tasks, community] = await Promise.all([
    supabase
      .from("notes")
      .select(
        `id, title, content, created_at, subject:subjects ( name )`,
      )
      .eq("user_id", scope.userId)
      .or(`title.ilike.${like},content.ilike.${like}`)
      .order("updated_at", { ascending: false })
      .limit(PER_GROUP),
    supabase
      .from("study_files")
      .select(
        `id, file_name, description, created_at, subject:subjects ( name )`,
      )
      .eq("user_id", scope.userId)
      .or(`file_name.ilike.${like},description.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(PER_GROUP),
    supabase
      .from("tasks")
      .select(
        `id, title, notes, created_at, subject:subjects ( name )`,
      )
      .eq("user_id", scope.userId)
      .or(`title.ilike.${like},notes.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(PER_GROUP),
    supabase
      .from("community_notes")
      .select(
        `id, title, content, created_at, subject:subjects ( name )`,
      )
      .eq("status", "approved")
      .eq("board_id", scope.boardId)
      .eq("class_id", scope.classId)
      .eq("medium_id", scope.mediumId)
      .or(`title.ilike.${like},content.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(PER_GROUP),
  ]);

  const makeHit = (
    entityType: SearchHit["entityType"],
    href: (id: string) => string,
    row: {
      id: string;
      title?: string;
      file_name?: string;
      content?: string | null;
      notes?: string | null;
      description?: string | null;
      created_at: string;
      subject?: { name: string } | { name: string }[] | null;
    },
  ): SearchHit => {
    const title = row.title ?? row.file_name ?? "";
    const rawBody = row.content ?? row.notes ?? row.description ?? "";
    const flat = rawBody.replace(/\s+/g, " ").trim();
    const idx = flat.toLowerCase().indexOf(q.toLowerCase());
    const start = idx >= 0 ? Math.max(0, idx - 40) : 0;
    const snippet =
      flat.slice(start, start + SNIPPET_MAX) + (flat.length > start + SNIPPET_MAX ? "…" : "");
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    return {
      id: row.id,
      entityType,
      href: href(row.id),
      title,
      snippet: snippet || "—",
      subjectName: subject?.name ?? null,
      createdAt: row.created_at,
    };
  };

  const notesHits: SearchHit[] = (notes.data ?? []).map((r) =>
    makeHit("note", (id) => `/app/notes/${id}`, r),
  );
  const filesHits: SearchHit[] = (files.data ?? []).map((r) =>
    makeHit("file", (id) => `/app/library/${id}`, r),
  );
  const tasksHits: SearchHit[] = (tasks.data ?? []).map((r) =>
    makeHit("task", () => "/app/tasks", r),
  );
  const communityHits: SearchHit[] = (community.data ?? []).map((r) =>
    makeHit("community_note", (id) => `/app/community/${id}`, r),
  );

  return ok({
    query: q,
    notes: notesHits,
    files: filesHits,
    tasks: tasksHits,
    community: communityHits,
    total:
      notesHits.length + filesHits.length + tasksHits.length + communityHits.length,
  });
}
