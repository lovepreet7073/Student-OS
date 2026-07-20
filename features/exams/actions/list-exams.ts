"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Exam } from "../types";

/**
 * Returns the caller's exams. `includePast=false` (default) filters to
 * exams on or after today. Ordered by date ascending — nearest first.
 */
export async function listExams(
  options: { includePast?: boolean; limit?: number } = {},
): Promise<Result<Exam[], ActionError>> {
  const { includePast = false, limit = 50 } = options;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayIso = `${yyyy}-${mm}-${dd}`;

  let query = supabase
    .from("exam_dates")
    .select(`id, subject_id, name, exam_date, notes, created_at, subject:subjects ( name )`)
    .eq("user_id", user.id)
    .order("exam_date", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (!includePast) {
    query = query.gte("exam_date", todayIso);
  }

  const { data, error } = await query;
  if (error) return err({ code: "DB", message: "Couldn't load exams." });

  const todayMs = Date.parse(todayIso + "T00:00:00Z");

  const items: Exam[] = (data ?? []).map((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    const examMs = Date.parse(row.exam_date + "T00:00:00Z");
    const daysUntil = Math.round((examMs - todayMs) / 86400000);
    return {
      id: row.id,
      subjectId: row.subject_id,
      subjectName: subject?.name ?? null,
      name: row.name,
      examDate: row.exam_date,
      notes: row.notes,
      daysUntil,
      createdAt: row.created_at,
    };
  });

  return ok(items);
}
