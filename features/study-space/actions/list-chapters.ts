"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Chapter } from "../types";

/**
 * Lists all chapters the current user has created, across all their subjects.
 * Small dataset (max maybe ~50 chapters per user) — no pagination.
 */
export async function listChapters(): Promise<Result<Chapter[], ActionError>> {
  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("chapters")
    .select("id, user_id, subject_id, name, sort_order, created_at, updated_at")
    .eq("user_id", scope.userId)
    .in("subject_id", scope.subjectIds)
    .order("subject_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return err({ code: "DB", message: "Couldn't load chapters." });

  return ok(
    (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      subjectId: row.subject_id,
      name: row.name,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );
}
