"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { BookmarkOverview } from "../types";

/**
 * Three parallel queries — notes, files, community bookmarks — each capped
 * at 30 items. Returns items with the shape the unified bookmarks page needs
 * (kind, id, title, subtitle, href, updatedAt). No per-kind pagination for
 * MVP; if a student crosses the cap we'll add per-tab load-more.
 */
export async function listBookmarks(): Promise<
  Result<BookmarkOverview, ActionError>
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const [notesRes, filesRes, communityRes] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title, updated_at, subject:subjects ( name )")
      .eq("user_id", user.id)
      .eq("is_bookmarked", true)
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase
      .from("study_files")
      .select("id, title, mime_type, updated_at, subject:subjects ( name )")
      .eq("user_id", user.id)
      .eq("is_bookmarked", true)
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase
      .from("community_bookmarks")
      .select(
        `created_at,
         note:community_notes ( id, title, author_display_name, created_at )`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (notesRes.error || filesRes.error || communityRes.error) {
    return err({ code: "DB", message: "Couldn't load your bookmarks." });
  }

  const notes = (notesRes.data ?? []).map((n) => {
    const subj = Array.isArray(n.subject) ? n.subject[0] : n.subject;
    return {
      kind: "note" as const,
      id: n.id,
      title: n.title || "Untitled note",
      subtitle: subj?.name ?? "Note",
      href: `/app/notes/${n.id}`,
      updatedAt: n.updated_at,
    };
  });

  const files = (filesRes.data ?? []).map((f) => {
    const subj = Array.isArray(f.subject) ? f.subject[0] : f.subject;
    return {
      kind: "file" as const,
      id: f.id,
      title: f.title || "Untitled file",
      subtitle: subj?.name ?? f.mime_type ?? "File",
      href: `/app/library/${f.id}`,
      updatedAt: f.updated_at,
    };
  });

  const community = (communityRes.data ?? []).flatMap((row) => {
    const note = Array.isArray(row.note) ? row.note[0] : row.note;
    if (!note) return [];
    return [
      {
        kind: "community_note" as const,
        id: note.id,
        title: note.title || "Untitled",
        subtitle: `Shared by ${note.author_display_name}`,
        href: `/app/community/${note.id}`,
        updatedAt: row.created_at,
      },
    ];
  });

  return ok({
    notes,
    files,
    community,
    totals: {
      notes: notes.length,
      files: files.length,
      community: community.length,
      all: notes.length + files.length + community.length,
    },
  });
}
