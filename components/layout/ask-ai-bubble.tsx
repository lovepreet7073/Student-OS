"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

/**
 * Global "Ask AI" floating bubble (Module 61). Fixed to the
 * bottom-right of every `/app/*` route so a student can jump into the
 * AI Study Chat from wherever they are — a note, a flashcard deck,
 * the calendar, whatever.
 *
 * Hidden on:
 *   - Chat pages themselves (`/app/chat*`) — redundant there.
 *   - Full-screen review / take flows where the FAB would collide
 *     with the primary CTA (`/app/practice`'s review sessions, quiz
 *     takers). The `/app/dashboard` FAB for "New note" also lives
 *     bottom-right; there we sit slightly higher to avoid overlap.
 *
 * On mobile the bubble sits above the bottom nav (66px + safe-area).
 * On desktop it floats near the bottom-right corner as expected.
 */
export function AskAiBubble() {
  const pathname = usePathname();

  const isHidden =
    pathname.startsWith("/app/chat") ||
    pathname.startsWith("/app/flashcards/") &&
      (pathname.endsWith("/review") || pathname.endsWith("/inbox") || pathname.endsWith("/weak")) ||
    pathname.startsWith("/app/help");

  if (isHidden) return null;

  return (
    <Link
      href="/app/chat/new"
      aria-label="Ask AI a question"
      className="fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-extrabold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-6"
    >
      <Sparkles className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      <span>Ask AI</span>
    </Link>
  );
}
