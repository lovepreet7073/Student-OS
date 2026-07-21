import { redirect } from "next/navigation";

/**
 * Legacy alias. Module 61 killed Doubt Solver as a separate feature —
 * it duplicated the AI Study Chat with less capability (one-shot only,
 * no attachments, no voice, no history threads). Every doubt now lands
 * in the main chat instead. Old rows in `ai_doubts` are preserved but
 * no longer reachable from the UI.
 */
export default function LegacyDoubtRedirect() {
  redirect("/app/chat");
}
