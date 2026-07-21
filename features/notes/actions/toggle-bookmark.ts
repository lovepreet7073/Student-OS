"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({
  id: z.string().uuid(),
  isBookmarked: z.boolean(),
});

/**
 * Sets the bookmark state to an explicit boolean, so the client tells the
 * server exactly what it wants (avoids double-toggle races on double-click).
 */
export async function toggleBookmark(input: {
  id: string;
  isBookmarked: boolean;
}): Promise<Result<{ isBookmarked: boolean }, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid bookmark update." });
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("notes")
    .update({ is_bookmarked: parsed.data.isBookmarked })
    .eq("id", parsed.data.id)
    .select("is_bookmarked")
    .maybeSingle();

  if (error) {
    return err({ code: "DB", message: "Couldn't update bookmark." });
  }
  if (!data) {
    return err({ code: "NOT_FOUND", message: "Note not found." });
  }

  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${parsed.data.id}`);
  revalidatePath("/app/bookmarks");

  return ok({ isBookmarked: data.is_bookmarked });
}
