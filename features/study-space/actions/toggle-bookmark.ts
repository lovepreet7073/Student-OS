"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({
  id: z.string().uuid(),
  isBookmarked: z.boolean(),
});

export async function toggleFileBookmark(input: {
  id: string;
  isBookmarked: boolean;
}): Promise<Result<{ isBookmarked: boolean }, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid input." });

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("study_files")
    .update({ is_bookmarked: parsed.data.isBookmarked })
    .eq("id", parsed.data.id)
    .select("is_bookmarked")
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't update bookmark." });
  if (!data) return err({ code: "NOT_FOUND", message: "File not found." });

  revalidatePath("/app/library");
  revalidatePath(`/app/library/${parsed.data.id}`);
  revalidatePath("/app/bookmarks");
  return ok({ isBookmarked: data.is_bookmarked });
}
