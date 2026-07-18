import { cache } from "react";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import type { AcademicScope } from "@/features/academic-identity/types";

/**
 * Returns the caller's academic scope — the IDs every future feature filters by.
 * Use in Server Components / Server Actions:
 *
 *   const scope = await getAcademicScope();
 *   if (!scope) redirect("/onboarding");
 *
 *   supabase.from("notes")
 *     .select()
 *     .eq("board_id", scope.boardId)
 *     .eq("class_id", scope.classId)
 *     .in("subject_id", scope.subjectIds);
 *
 * Wrapped in React `cache()` — safe to call from multiple RSCs in one request.
 */
export const getAcademicScope = cache(async (): Promise<AcademicScope | null> => {
  const profile = await getMyProfile();
  if (!profile) return null;

  return {
    userId: profile.userId,
    boardId: profile.board.id,
    classId: profile.classLevel.id,
    mediumId: profile.medium.id,
    subjectIds: profile.subjects.map((s) => s.id),
  };
});
