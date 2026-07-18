"use server";

import { getAcademicScope } from "@/lib/academic/scope";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import { todayIsoDate } from "../lib/dates";
import {
  listTasksSchema,
  type ListTasksInput,
} from "../schemas/task";
import type { TasksListResult } from "../types";

/**
 * Filter semantics:
 *   today    → completed_at IS NULL AND (due_date = today OR due_date IS NULL AND created today)
 *              i.e. things a student sees in their "today's plan"
 *   upcoming → completed_at IS NULL AND due_date > today
 *   backlog  → completed_at IS NULL AND due_date IS NULL AND created before today
 *   done     → completed_at IS NOT NULL
 *   all      → no completion filter
 */
export async function listTasks(
  input: Partial<ListTasksInput> = {},
): Promise<Result<TasksListResult, ActionError>> {
  const parsed = listTasksSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: "VALIDATION", message: "Invalid filter." });
  }

  const scope = await getAcademicScope();
  if (!scope) return err({ code: "FORBIDDEN", message: "Complete onboarding first." });

  const supabase = await getSupabaseServer();
  const today = todayIsoDate();
  const { filter, subjectId, limit } = parsed.data;

  let query = supabase
    .from("tasks")
    .select(
      `
        id, user_id, board_id, class_id, medium_id, subject_id,
        title, notes, due_date, completed_at, is_pinned,
        created_at, updated_at,
        subject:subjects ( name )
      `,
      { count: "exact" },
    )
    .eq("user_id", scope.userId)
    .eq("board_id", scope.boardId)
    .eq("class_id", scope.classId)
    .eq("medium_id", scope.mediumId);

  if (subjectId) query = query.eq("subject_id", subjectId);

  switch (filter) {
    case "today":
      query = query
        .is("completed_at", null)
        .or(`due_date.eq.${today},due_date.is.null`)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "upcoming":
      query = query
        .is("completed_at", null)
        .gt("due_date", today)
        .order("due_date", { ascending: true });
      break;
    case "backlog":
      query = query
        .is("completed_at", null)
        .is("due_date", null)
        .order("created_at", { ascending: false });
      break;
    case "done":
      query = query
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });
      break;
    case "all":
      query = query
        .order("completed_at", { ascending: true, nullsFirst: true })
        .order("due_date", { ascending: true, nullsFirst: false });
      break;
  }

  const { data, error, count } = await query.limit(limit);

  if (error) {
    return err({ code: "DB", message: "Couldn't load tasks. Try again." });
  }

  const items = (data ?? []).map((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
    return {
      id: row.id,
      userId: row.user_id,
      boardId: row.board_id,
      classId: row.class_id,
      mediumId: row.medium_id,
      subjectId: row.subject_id,
      subjectName: subject?.name ?? null,
      title: row.title,
      notes: row.notes,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      isPinned: row.is_pinned,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  return ok({ items, total: count ?? items.length });
}
