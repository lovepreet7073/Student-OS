"use server";

import { randomUUID } from "crypto";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

interface BeginArgs {
  conversationId: string;
  mimeType: string;
}

interface BeginResult {
  path: string;
  uploadUrl: string;
  uploadToken: string;
}

/**
 * Reserves a storage path for a chat attachment and issues a signed
 * upload URL. Mirrors the study-space begin/complete pattern (ADR from
 * Module 8) so bytes never travel through the app server.
 *
 * Ownership is guaranteed by the storage RLS policy:
 *   (storage.foldername(name))[1] = auth.uid()::text
 * — so a user can only upload to a path prefixed with their own uid,
 * even if the client fabricates a different path.
 */
export async function beginAttachmentUpload(
  args: BeginArgs,
): Promise<Result<BeginResult, ActionError>> {
  if (!ALLOWED.has(args.mimeType)) {
    return err({
      code: "VALIDATION",
      message: "Only PNG, JPEG, WEBP images or PDFs are supported.",
    });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const ext =
    args.mimeType === "image/png"
      ? "png"
      : args.mimeType === "image/webp"
        ? "webp"
        : args.mimeType === "application/pdf"
          ? "pdf"
          : "jpg";
  const path = `${user.id}/${args.conversationId}/${randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return err({ code: "DB", message: "Couldn't reserve an upload slot." });
  }

  return ok({
    path,
    uploadUrl: data.signedUrl,
    uploadToken: data.token,
  });
}
