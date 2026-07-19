"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

import type { ActivityAction, WorkspaceEntityType } from "../types";

interface LogArgs {
  entityType: WorkspaceEntityType;
  entityId: string;
  action: ActivityAction;
  title: string;
}

/**
 * Fire-and-forget activity logger. Never throws — the source flow (opening a
 * note, uploading a file) must not fail just because we couldn't record the
 * event. Duplicate "opened" events on the same day are silently dropped by
 * the unique index — we swallow the 23505 error so the caller doesn't care.
 */
export async function logActivity(args: LogArgs): Promise<void> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const trimmedTitle = args.title.trim().slice(0, 200);

    const { error } = await supabase.from("activity_events").insert({
      user_id: user.id,
      entity_type: args.entityType,
      entity_id: args.entityId,
      action: args.action,
      title: trimmedTitle,
    });

    if (error && error.code !== "23505") {
      console.error("[logActivity] insert failed", { code: error.code, message: error.message });
    }
  } catch (err) {
    console.error("[logActivity] unexpected", err);
  }
}
