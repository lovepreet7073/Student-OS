import { redirect } from "next/navigation";

/**
 * Legacy alias. Module 59 folded flashcards into the unified Practice
 * hub at `/app/practice` (flashcards is the default view). Sub-routes
 * `/app/flashcards/[id]`, `/inbox`, `/weak`, `/new` are unaffected
 * and still work.
 */
export default function LegacyFlashcardsRedirect() {
  redirect("/app/practice");
}
