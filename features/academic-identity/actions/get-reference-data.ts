"use server";

import { cache } from "react";

import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

import type { ReferenceData } from "../types";

/**
 * Fetches boards + mediums + classes in parallel. Reference data is public
 * to authenticated users and rarely changes, so this is safe to cache
 * per-request with React `cache()`.
 */
export const getReferenceData = cache(async (): Promise<Result<ReferenceData, ActionError>> => {
  const supabase = await getSupabaseServer();

  const [boardsRes, mediumsRes, classesRes] = await Promise.all([
    supabase.from("boards").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("mediums").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("classes").select("*").eq("is_active", true).order("sort_order"),
  ]);

  if (boardsRes.error || mediumsRes.error || classesRes.error) {
    return err({
      code: "DB",
      message: "Couldn't load academic options. Please refresh.",
    });
  }

  return ok({
    boards: (boardsRes.data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      shortName: b.short_name,
      slug: b.slug,
      sortOrder: b.sort_order,
    })),
    mediums: (mediumsRes.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      nativeName: m.native_name,
      locale: m.locale,
      sortOrder: m.sort_order,
    })),
    classes: (classesRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
    })),
  });
});
