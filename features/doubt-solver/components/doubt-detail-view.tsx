"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-date";

import type { Doubt } from "../types";

interface Props {
  doubt: Doubt;
}

/**
 * Detail view for a single doubt. If the row is still `processing`, we poll
 * every 3s via router.refresh() until it flips to answered/failed. Same
 * pattern as test-evaluation status card (Module 9).
 */
export function DoubtDetailView({ doubt }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (doubt.status !== "processing") return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [doubt.status, router]);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Back" className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/doubt">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <span className="text-[13px] font-bold text-muted-foreground">
          Asked {formatRelativeTime(doubt.createdAt)}
        </span>
      </nav>

      <section
        className="rounded-xl border border-border bg-card p-5 sm:p-6"
        aria-label="Your question"
      >
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
          You asked
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{doubt.question}</p>
      </section>

      {doubt.status === "processing" ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
        >
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 animate-pulse text-warning" strokeWidth={2} />
          <div>
            <div className="text-[14px] font-bold">AI is thinking…</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
              This usually takes a few seconds. This page auto-refreshes.
            </div>
          </div>
        </div>
      ) : doubt.status === "failed" ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4"
        >
          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" strokeWidth={2} />
          <div>
            <div className="text-[14px] font-bold text-danger">
              AI couldn&apos;t answer this one
            </div>
            {doubt.errorMessage ? (
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                {doubt.errorMessage}
              </div>
            ) : null}
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/app/doubt">Ask another question</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <section
          className="rounded-xl border border-border bg-card p-5 sm:p-6"
          aria-label="AI answer"
        >
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-primary">
            AI answer
          </div>
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {doubt.answer}
          </div>
        </section>
      )}
    </div>
  );
}
