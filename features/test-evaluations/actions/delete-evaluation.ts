"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { deleteEvaluationSchema } from "../schemas/evaluation";

const BUCKET = "test-answers";

/**
 * Deletes the evaluation + all pages + all Storage objects.
 * Storage-first to keep any orphan visible in the DB (retryable), same
 * reasoning as Module 8's file delete.
 */
export async function deleteEvaluation(
  input: { id: string },
  options?: { redirectTo?: string },
): Promise<Result<null, ActionError>> {
  const parsed = deleteEvaluationSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid id." });

  const supabase = await getSupabaseServer();

  const { data: pages } = await supabase
    .from("test_evaluation_pages")
    .select("storage_path")
    .eq("evaluation_id", parsed.data.id);

  if (pages && pages.length > 0) {
    const paths = pages.map((p) => p.storage_path);
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from("test_evaluations").delete().eq("id", parsed.data.id);
  if (error) return err({ code: "DB", message: "Couldn't delete the evaluation." });

  revalidatePath("/app/tests");
  if (options?.redirectTo) redirect(options.redirectTo);
  return ok(null);
}
