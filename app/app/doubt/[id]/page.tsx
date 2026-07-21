import { redirect } from "next/navigation";

/**
 * Legacy alias. Existing bookmarks to a specific doubt land in the
 * main chat now that Doubt Solver has been killed. See parent
 * `/app/doubt/page.tsx` for the rationale.
 */
export default function LegacyDoubtDetailRedirect() {
  redirect("/app/chat");
}
