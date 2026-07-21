"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Global keyboard shortcuts. Currently just ⌘K / Ctrl+K → global
 * search. Mounted once in the app shell.
 *
 * Ignores the shortcut when the user is typing in a text field so
 * ⌘K inside a Textarea (e.g. the chat composer) doesn't hijack their
 * flow.
 */
export function GlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const target = e.target as HTMLElement | null;
        const editable =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        // Cmd/Ctrl+K in an editor context is fine to hijack — most
        // shortcuts there (like markdown link) aren't in play. But
        // allow-list a couple: if the input is single-char search-y
        // (`type="search"`), let the browser handle it.
        if (
          editable &&
          target instanceof HTMLInputElement &&
          target.type === "search"
        ) {
          return;
        }
        e.preventDefault();
        router.push("/app/search");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
