"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { Subject } from "../types";

interface Args {
  name: string;
  boardId: string;
  classId: string;
  mediumId: string;
}

/**
 * Adds a personal (user-owned) subject scoped to the given board × class ×
 * medium triple. Visible only to the caller thanks to the RLS policy set in
 * migration 13.
 *
 * Slug is derived from the name so a user's "Vocational Studies" becomes
 * `vocational-studies`. `sort_order` gets a high value so custom subjects
 * fall to the end of the list.
 */
export async function addCustomSubject(args: Args): Promise<Result<Subject, ActionError>> {
  const name = args.name.trim();
  if (name.length === 0) return err({ code: "VALIDATION", message: "Enter a subject name" });
  if (name.length > 60) return err({ code: "VALIDATION", message: "Subject name is too long" });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err({ code: "UNAUTHORIZED", message: "Please sign in." });

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `custom-${Date.now()}`;

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      name,
      slug,
      board_id: args.boardId,
      class_id: args.classId,
      medium_id: args.mediumId,
      sort_order: 900,
      is_active: true,
      created_by: user.id,
    })
    .select("id, board_id, class_id, medium_id, name, slug, sort_order")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return err({ code: "CONFLICT", message: "You already have a subject with that name." });
    }
    return err({ code: "DB", message: "Couldn't add the subject." });
  }

  return ok({
    id: data.id,
    boardId: data.board_id,
    classId: data.class_id,
    mediumId: data.medium_id,
    name: data.name,
    slug: data.slug,
    sortOrder: data.sort_order,
  });
}
