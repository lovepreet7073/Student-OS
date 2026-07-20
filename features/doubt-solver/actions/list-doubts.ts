"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Doubt, DoubtStatus } from "../types";

export async function listDoubts(limit = 20): Promise<Result<Doubt[], ActionError>> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("ai_doubts")
    .select("id, subject_id, question, answer, status, error_message, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) return err({ code: "DB", message: "Couldn't load your questions." });

  return ok(
    (data ?? []).map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      question: row.question,
      answer: row.answer,
      status: row.status as DoubtStatus,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );
}
