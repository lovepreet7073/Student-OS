"use client";

import Link from "next/link";
import { Check } from "lucide-react";

interface DoneStepProps {
  boardShortName: string;
  mediumLabel: string;
  className: string;
}

export function DoneStep({ boardShortName, mediumLabel, className }: DoneStepProps) {
  return (
    <section className="flex flex-col items-center pt-5 text-center animate-step-in">
      <div className="animate-pop mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-success/12 text-success">
        <Check className="h-11 w-11" strokeWidth={3} />
      </div>
      <h1 className="mb-2.5 text-[30px] font-extrabold tracking-tight">
        You&rsquo;re all set, let&rsquo;s go!
      </h1>
      <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
        Your workspace is personalised for {boardShortName} · {mediumLabel} · Class {className}.
      </p>
      <Link
        href="/app/dashboard"
        className="mt-8 inline-flex h-[54px] items-center justify-center rounded-lg bg-primary px-7 text-base font-bold text-primary-foreground shadow-[0_10px_26px_-8px_hsl(var(--primary)/0.55)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Go to dashboard
      </Link>
    </section>
  );
}
