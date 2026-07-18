import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-svh flex-col px-safe">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <Logo priority variant="responsive" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:gap-8 sm:px-6 sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-brand-accent" aria-hidden />
          AI-powered study platform
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
          The operating system{" "}
          <span className="text-muted-foreground">for modern students.</span>
        </h1>

        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Plan smarter, learn faster, and stay on track with AI-powered notes, quizzes,
          flashcards, and a personal study planner.
        </p>

        <div className="flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Button asChild size="lg" fullWidth className="sm:w-auto">
            <Link href="/signup">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" fullWidth className="sm:w-auto">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-safe pt-6 text-center text-sm text-muted-foreground sm:px-6 sm:pb-8">
        &copy; {new Date().getFullYear()} StudyOS. All rights reserved.
      </footer>
    </main>
  );
}
