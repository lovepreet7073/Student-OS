"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import {
  subjectScopeSchema,
  type SubjectScopeInput,
} from "../schemas/preferences";
import type { Subject } from "../types";

/**
 * Fetches subjects scoped to a (board, class, medium) triple. Called
 * reactively from the onboarding wizard whenever the triple settles.
 */
export async function getSubjects(
  input: SubjectScopeInput,
): Promise<Result<Subject[], ActionError>> {
  const parsed = subjectScopeSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: "VALIDATION",
      message: "Choose a board, class and medium first.",
    });
  }

  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("subjects")
    .select("id, board_id, class_id, medium_id, name, slug, sort_order")
    .eq("board_id", parsed.data.boardId)
    .eq("class_id", parsed.data.classId)
    .eq("medium_id", parsed.data.mediumId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    return err({ code: "DB", message: "Couldn't load subjects. Try again." });
  }

  return ok(
    (data ?? []).map((s) => ({
      id: s.id,
      boardId: s.board_id,
      classId: s.class_id,
      mediumId: s.medium_id,
      name: s.name,
      slug: s.slug,
      sortOrder: s.sort_order,
    })),
  );
}
