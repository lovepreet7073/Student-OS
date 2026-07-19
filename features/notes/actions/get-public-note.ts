"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export interface PublicNote {
  id: string;
  title: string;
  content: string;
  subjectName: string;
  authorDisplayName: string;
  createdAt: string;
}

/**
 * Reads a note by share token. The `notes public read via token` RLS policy
 * gates visibility — the anon key alone won't return rows unless the row is
 * `visibility = 'link'`.
 *
 * Author display name is best-effort: we look at auth.users via user_metadata
 * only if the requester is authenticated. Public visitors see "A student".
 */
export async function getPublicNote(
  token: string,
): Promise<Result<PublicNote, ActionError>> {
  if (!token) return err({ code: "VALIDATION", message: "Missing share token." });

  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("notes")
    .select(
      `
        id, user_id, title, content, created_at,
        subject:subjects ( name )
      `,
    )
    .eq("share_token", token)
    .eq("visibility", "link")
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't load the note." });
  if (!data) return err({ code: "NOT_FOUND", message: "Note not found or link revoked." });

  const subject = Array.isArray(data.subject) ? data.subject[0] : data.subject;

  return ok({
    id: data.id,
    title: data.title,
    content: data.content,
    subjectName: subject?.name ?? "—",
    authorDisplayName: "A student",
    createdAt: data.created_at,
  });
}
