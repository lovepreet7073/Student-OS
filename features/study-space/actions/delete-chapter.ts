"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({ id: z.string().uuid() });

/**
 * Deletes a chapter. Files inside get their chapter_id nulled (moved to
 * "Unfiled") by the ON DELETE SET NULL FK — the files themselves are safe.
 */
export async function deleteChapter(input: {
  id: string;
}): Promise<Result<null, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid id." });

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("chapters").delete().eq("id", parsed.data.id);

  if (error) return err({ code: "DB", message: "Couldn't delete the chapter." });
  revalidatePath("/app/library");
  return ok(null);
}
