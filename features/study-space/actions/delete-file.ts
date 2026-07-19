"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { STORAGE_BUCKET } from "../lib/mime";

const inputSchema = z.object({ id: z.string().uuid() });

/**
 * Two-step delete: remove the Storage object, then delete the DB row.
 * Row-first ordering leaves orphans in Storage on partial failure; Storage-
 * first ordering leaves orphaned rows. We pick Storage-first because a
 * broken metadata row is more visible (and cleanable via a second delete
 * click) than an orphaned blob invisible to users.
 */
export async function deleteFile(
  input: { id: string },
  options?: { redirectTo?: string },
): Promise<Result<null, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid id." });

  const supabase = await getSupabaseServer();

  const { data: file } = await supabase
    .from("study_files")
    .select("storage_path")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!file) return err({ code: "NOT_FOUND", message: "File not found." });

  // Remove the object first — Storage RLS will refuse if it's not the user's own file.
  const { error: storageErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([file.storage_path]);

  // A "not found" during storage remove is fine — the object may already be gone.
  if (storageErr && !storageErr.message?.toLowerCase().includes("not found")) {
    return err({ code: "DB", message: "Couldn't delete the file from storage." });
  }

  const { error: dbErr } = await supabase.from("study_files").delete().eq("id", parsed.data.id);
  if (dbErr) {
    return err({ code: "DB", message: "Couldn't delete the file record." });
  }

  revalidatePath("/app/library");

  if (options?.redirectTo) redirect(options.redirectTo);
  return ok(null);
}
