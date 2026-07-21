"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { ActivityAction, ActivityEvent, WorkspaceEntityType } from "../types";

interface ListArgs {
  action?: ActivityAction;
  limit?: number;
}

const ENTITY_TYPES = new Set<WorkspaceEntityType>([
  "note",
  "file",
  "task",
  "quiz",
  "study_plan",
  "test_evaluation",
  "community_note",
  "flashcard_deck",
]);

const ACTIONS = new Set<ActivityAction>(["opened", "uploaded", "created"]);

/**
 * Newest-first activity for the caller. Optionally filtered by action
 * ("opened" for Recently opened, "uploaded" for Recently uploaded).
 */
export async function listRecentActivity(
  args: ListArgs = {},
): Promise<Result<ActivityEvent[], ActionError>> {
  const limit = Math.min(Math.max(args.limit ?? 12, 1), 50);
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("activity_events")
    .select("id, entity_type, entity_id, action, title, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (args.action) {
    query = query.eq("action", args.action);
  }

  const { data, error } = await query;
  if (error) return err({ code: "DB", message: "Couldn't load recent activity." });

  const items: ActivityEvent[] = (data ?? [])
    .filter(
      (row) =>
        ENTITY_TYPES.has(row.entity_type as WorkspaceEntityType) &&
        ACTIONS.has(row.action as ActivityAction),
    )
    .map((row) => ({
      id: row.id,
      entityType: row.entity_type as WorkspaceEntityType,
      entityId: row.entity_id,
      action: row.action as ActivityAction,
      title: row.title,
      createdAt: row.created_at,
    }));

  return ok(items);
}
