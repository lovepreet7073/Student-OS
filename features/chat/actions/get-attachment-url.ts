"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

/**
 * Short-lived signed URL for viewing a chat attachment. RLS on
 * `storage.objects` ensures only the owner can read it, so the URL
 * itself is safe to hand back to the browser.
 */
export async function getAttachmentUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<Result<string, ActionError>> {
  if (!path) return err({ code: "VALIDATION", message: "Missing attachment path." });

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't load the image." });
  }

  return ok(data.signedUrl);
}
