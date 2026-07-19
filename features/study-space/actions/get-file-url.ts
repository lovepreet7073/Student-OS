"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { STORAGE_BUCKET } from "../lib/mime";

/**
 * Returns a short-lived signed URL for viewing or downloading a file.
 * The bucket is private → we can't just serve `getPublicUrl`. Signed URLs
 * expire in 1 hour, which is plenty for viewing a PDF/image inline.
 */
export async function getFileUrl(
  fileId: string,
): Promise<Result<{ url: string; expiresInSeconds: number }, ActionError>> {
  const supabase = await getSupabaseServer();

  const { data: file, error: fileErr } = await supabase
    .from("study_files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileErr || !file) return err({ code: "NOT_FOUND", message: "File not found." });

  const expiresInSeconds = 60 * 60; // 1 hour
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(file.storage_path, expiresInSeconds);

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't create download link." });
  }
  return ok({ url: data.signedUrl, expiresInSeconds });
}
