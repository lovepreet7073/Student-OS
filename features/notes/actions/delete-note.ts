"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

const inputSchema = z.object({ id: z.string().uuid() });

export async function deleteNote(
  input: { id: string },
  options?: { redirectTo?: string },
): Promise<Result<null, ActionError>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid note id." });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  // Explicit ownership filter + row-count check. RLS should already prevent
  // cross-user deletes, but with the Module 16 share-via-link policy in play
  // it's safer to double-guard here. If the returned array is empty, the
  // delete matched nothing (either wrong id or not the caller's note) — we
  // surface that as NOT_FOUND instead of a silent success.
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[deleteNote] supabase error", error);
    return err({ code: "DB", message: "Couldn't delete the note." });
  }
  if (!data || data.length === 0) {
    return err({
      code: "NOT_FOUND",
      message: "That note doesn't exist or isn't yours.",
    });
  }

  revalidatePath("/app/notes");
  revalidatePath("/app/workspace");

  if (options?.redirectTo) {
    redirect(options.redirectTo);
  }

  return ok(null);
}
