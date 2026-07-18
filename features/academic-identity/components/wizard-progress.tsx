"use client";

import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface WizardProgressProps {
  step: number;
  total: number;
  onBack: () => void;
  canGoBack: boolean;
}

export function WizardProgress({ step, total, onBack, canGoBack }: WizardProgressProps) {
  const pct = Math.round((step / total) * 100);

  return (
    <header className="flex-shrink-0 border-b border-border bg-card px-5 pb-3.5 pt-4 sm:px-10 sm:pb-4 sm:pt-5">
      <div className="mx-auto flex max-w-[640px] items-center gap-3.5">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-opacity",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            !canGoBack && "opacity-40 cursor-not-allowed",
          )}
          aria-label="Back"
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </button>
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-muted-foreground">
              Step {step} of {total}
            </span>
            <span className="text-[13px] font-bold text-primary">{pct}%</span>
          </div>
          <div
            className="h-[7px] overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
