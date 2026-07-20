import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PomodoroTimer } from "@/features/focus/components/pomodoro-timer";

export const metadata: Metadata = { title: "Focus" };

/**
 * Full-screen Pomodoro focus timer. Client-only, no DB, no history.
 * Config (focus/break minutes) persists via localStorage; the timer itself
 * resets on refresh — a Pomodoro is a single-session commitment.
 */
export default function FocusPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-140px)] max-w-[560px] flex-col px-5 pb-10 sm:px-7 lg:pb-16">
      <header className="flex items-center gap-3 pb-6 pt-4 sm:pt-6">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/dashboard">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div>
          <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-primary">
            Focus mode
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[24px]">
            Pomodoro timer
          </h1>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <PomodoroTimer />
      </main>

      <footer className="pt-8 text-center text-[11.5px] text-muted-foreground">
        Tip: put your phone face-down. The tab title shows the countdown.
      </footer>
    </div>
  );
}
