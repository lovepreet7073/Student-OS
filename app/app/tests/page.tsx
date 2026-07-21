import { redirect } from "next/navigation";

/**
 * Legacy alias. Module 59 folded test evaluations into the unified
 * Practice hub at `/app/practice?view=tests`. Sub-routes
 * `/app/tests/[id]` and `/app/tests/new` are unaffected and still work.
 */
export default function LegacyTestsRedirect() {
  redirect("/app/practice?view=tests");
}
