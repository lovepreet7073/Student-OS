import { redirect } from "next/navigation";

/**
 * Legacy alias. `/app/library` used to be its own page; Module 58
 * folded files into the unified Library at `/app/notes?view=files`.
 * All bookmarks, deep-links, and quick-actions that pointed here
 * bounce through to the new canonical URL.
 */
export default function LegacyLibraryRedirect() {
  redirect("/app/notes?view=files");
}
