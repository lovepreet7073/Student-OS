"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export type NoteVisibility = "private" | "link";

interface Args {
  noteId: string;
  visibility: NoteVisibility;
}

/**
 * Flips a note between private and link-shared.
 *
 * Going to `link`: if there's no token yet, we generate one via the
 * `new_share_token()` DB function. Existing tokens are reused so an author
 * can toggle off/on without invalidating a URL they've already shared.
 *
 * Going to `private`: token is preserved (so re-enabling re-uses it) but the
 * public RLS policy hides the row.
 */
export async function setNoteVisibility({
  noteId,
  visibility,
}: Args): Promise<Result<{ shareToken: string | null }, ActionError>> {
  if (!noteId) return err({ code: "VALIDATION", message: "Missing note id." });
  if (visibility !== "private" && visibility !== "link") {
    return err({ code: "VALIDATION", message: "Invalid visibility." });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const noteRes = await supabase
    .from("notes")
    .select("id, user_id, share_token")
    .eq("id", noteId)
    .maybeSingle();

  if (noteRes.error || !noteRes.data) {
    return err({ code: "NOT_FOUND", message: "Note not found." });
  }
  if (noteRes.data.user_id !== user.id) {
    return err({ code: "FORBIDDEN", message: "Not your note." });
  }

  let shareToken: string | null = noteRes.data.share_token ?? null;

  if (visibility === "link" && !shareToken) {
    const tokenRes = await supabase.rpc("new_share_token");
    if (tokenRes.error || typeof tokenRes.data !== "string") {
      return err({ code: "DB", message: "Couldn't generate a share token." });
    }
    shareToken = tokenRes.data.replace(/\s+/g, "");
  }

  const { error } = await supabase
    .from("notes")
    .update({
      visibility,
      ...(visibility === "link" ? { share_token: shareToken } : {}),
    })
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return err({ code: "DB", message: "Couldn't update sharing." });

  revalidatePath(`/app/notes/${noteId}`);
  return ok({ shareToken: visibility === "link" ? shareToken : null });
}
