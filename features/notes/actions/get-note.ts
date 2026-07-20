"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";
import { logActivity } from "@/features/workspace/actions/log-activity";

import type { NoteListItem } from "../types";

export async function getNote(
  id: string,
): Promise<Result<NoteListItem, ActionError>> {
  const supabase = await getSupabaseServer();

  // Explicit ownership filter — defence in depth beyond RLS. The Module 16
  // share-via-link RLS policy exposes rows where `visibility = 'link'` to
  // any authenticated user; without this filter, a signed-in student could
  // navigate to /app/notes/[id] and view a peer's shared note in the OWNER
  // UI (edit / delete / share). Enforce it up-front so /app/notes/[id]
  // only ever shows OWN notes; public link viewers use /s/n/[token].
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("notes")
    .select(
      `
        id, user_id, board_id, class_id, medium_id, subject_id, chapter_id,
        title, content, is_bookmarked, visibility, share_token,
        created_at, updated_at,
        subject:subjects ( name, slug ),
        chapter:chapters ( name )
      `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't load the note." });
  if (!data) return err({ code: "NOT_FOUND", message: "Note not found." });

  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject;
  const chapter = Array.isArray((data as { chapter?: unknown }).chapter)
    ? ((data as { chapter: { name: string }[] }).chapter[0] ?? null)
    : ((data as { chapter?: { name: string } | null }).chapter ?? null);

  // Fire-and-forget: swallows failure and dedupes to one open per day.
  await logActivity({
    entityType: "note",
    entityId: data.id,
    action: "opened",
    title: data.title,
  });

  const rawVisibility = (data as { visibility?: string | null }).visibility;
  const rawToken = (data as { share_token?: string | null }).share_token;

  return ok({
    id: data.id,
    userId: data.user_id,
    boardId: data.board_id,
    classId: data.class_id,
    mediumId: data.medium_id,
    subjectId: data.subject_id,
    chapterId: (data as { chapter_id?: string | null }).chapter_id ?? null,
    title: data.title,
    content: data.content,
    isBookmarked: data.is_bookmarked,
    visibility: rawVisibility === "link" ? "link" : "private",
    shareToken: rawToken ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    subjectName: subject?.name ?? "—",
    subjectSlug: subject?.slug ?? "",
    chapterName: chapter?.name ?? null,
  });
}
