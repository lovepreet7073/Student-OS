"use server";

import { cache } from "react";

import { getSupabaseServer } from "@/lib/supabase/server";

import type { AcademicProfile } from "../types";

/**
 * Returns the authenticated user's full academic profile — or null if they
 * haven't completed onboarding yet.
 *
 * Two queries in parallel:
 *   1. user_preferences JOIN boards/mediums/classes (direct FKs)
 *   2. user_subjects JOIN subjects  (no FK links preferences ↔ user_subjects,
 *      so a nested select from user_preferences would fail)
 *
 * Wrapped in React `cache()` so multiple RSCs in the same request share both
 * round-trips.
 */
export const getMyProfile = cache(async (): Promise<AcademicProfile | null> => {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [prefRes, subjectRes] = await Promise.all([
    supabase
      .from("user_preferences")
      .select(
        `
          preferred_language,
          created_at,
          updated_at,
          board:boards ( id, name, short_name, slug, sort_order ),
          medium:mediums ( id, name, slug, native_name, locale, sort_order ),
          class:classes ( id, name, sort_order )
        `,
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_subjects")
      .select(
        `subject:subjects ( id, board_id, class_id, medium_id, name, slug, sort_order )`,
      )
      .eq("user_id", user.id),
  ]);

  const pref = prefRes.data;
  if (!pref) return null;

  const board = Array.isArray(pref.board) ? pref.board[0] : pref.board;
  const medium = Array.isArray(pref.medium) ? pref.medium[0] : pref.medium;
  const classLevel = Array.isArray(pref.class) ? pref.class[0] : pref.class;
  if (!board || !medium || !classLevel) return null;

  const subjects = (subjectRes.data ?? [])
    .map((row) => (Array.isArray(row.subject) ? row.subject[0] : row.subject))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      id: s.id,
      boardId: s.board_id,
      classId: s.class_id,
      mediumId: s.medium_id,
      name: s.name,
      slug: s.slug,
      sortOrder: s.sort_order,
    }));

  const displayName =
    (user.user_metadata as { display_name?: string } | null | undefined)?.display_name ??
    user.email?.split("@")[0] ??
    "there";

  return {
    userId: user.id,
    displayName,
    email: user.email ?? "",
    board: {
      id: board.id,
      name: board.name,
      shortName: board.short_name,
      slug: board.slug,
      sortOrder: board.sort_order,
    },
    medium: {
      id: medium.id,
      name: medium.name,
      slug: medium.slug,
      nativeName: medium.native_name,
      locale: medium.locale,
      sortOrder: medium.sort_order,
    },
    classLevel: {
      id: classLevel.id,
      name: classLevel.name,
      sortOrder: classLevel.sort_order,
    },
    subjects,
    preferredLanguage: pref.preferred_language,
    createdAt: pref.created_at,
    updatedAt: pref.updated_at,
  };
});
