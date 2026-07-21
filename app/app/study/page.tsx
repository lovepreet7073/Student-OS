import { redirect } from "next/navigation";

/**
 * Legacy alias. Module 59 folded quizzes into the unified Practice
 * hub at `/app/practice?view=quizzes`. All bookmarks and existing
 * links land there. Sub-routes `/app/study/[id]` and `/app/study/new`
 * are unaffected and still work.
 */
export default function LegacyStudyRedirect() {
  redirect("/app/practice?view=quizzes");
}
