"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Doubt, DoubtStatus } from "../types";

export async function getDoubt(id: string): Promise<Result<Doubt, ActionError>> {
  if (!id) return err({ code: "VALIDATION", message: "Missing id." });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const { data, error } = await supabase
    .from("ai_doubts")
    .select("id, subject_id, question, answer, status, error_message, created_at, updated_at, user_id")
    .eq("id", id)
    .maybeSingle();

  if (error) return err({ code: "DB", message: "Couldn't load the question." });
  if (!data) return err({ code: "NOT_FOUND", message: "Not found." });
  if (data.user_id !== user.id) return err({ code: "FORBIDDEN", message: "Not yours." });

  return ok({
    id: data.id,
    subjectId: data.subject_id,
    question: data.question,
    answer: data.answer,
    status: data.status as DoubtStatus,
    errorMessage: data.error_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}
