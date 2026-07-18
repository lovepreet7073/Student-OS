"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type { Subject } from "@/features/academic-identity/types";

import { NotesSearchInput } from "./notes-search-input";
import { SubjectFilterChips } from "./subject-filter-chips";

interface NotesToolbarProps {
  subjects: Subject[];
}

/**
 * URL-synced filter/search state. Uses `router.replace` (not push) to avoid
 * polluting browser history with every keystroke.
 *
 * Query params:
 *   - `subject`   → subject UUID or omitted
 *   - `q`         → search string
 */
export function NotesToolbar({ subjects }: NotesToolbarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const activeSubjectId = params.get("subject");
  const search = params.get("q") ?? "";

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `/app/notes?${qs}` : "/app/notes", { scroll: false });
    },
    [params, router],
  );

  return (
    <div className="flex flex-col gap-3.5">
      <NotesSearchInput value={search} onChange={(q) => setParam({ q: q || null })} />
      <SubjectFilterChips
        subjects={subjects}
        activeSubjectId={activeSubjectId}
        onChange={(id) => setParam({ subject: id })}
      />
    </div>
  );
}
