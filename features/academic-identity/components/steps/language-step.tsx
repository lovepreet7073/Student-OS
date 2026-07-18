"use client";

import { Check, Info } from "lucide-react";

import { LOCALE_METADATA, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

import { StepHeading } from "./step-heading";

interface LanguageStepProps {
  selectedCode: Locale | null;
  onSelect: (code: Locale) => void;
  mediumLabel: string;
}

export function LanguageStep({ selectedCode, onSelect, mediumLabel }: LanguageStepProps) {
  return (
    <section
      className="animate-step-in flex flex-col gap-6"
      role="radiogroup"
      aria-label="Interface language"
    >
      <StepHeading
        title="Interface language"
        description="The language of buttons and menus. Your study material stays in your chosen medium."
      />
      <div className="flex flex-col gap-3">
        {LOCALE_METADATA.map((meta) => {
          const selected = selectedCode === meta.code;
          return (
            <button
              key={meta.code}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!meta.released}
              onClick={() => meta.released && onSelect(meta.code)}
              className={cn(
                "flex min-h-[64px] w-full items-center gap-4 rounded-lg bg-card p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "border-2 border-primary bg-accent"
                  : "border border-border hover:border-primary/40",
                !meta.released && "cursor-not-allowed opacity-50",
              )}
            >
              <span aria-hidden className="text-2xl">
                {meta.flag}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-bold leading-tight">{meta.name}</span>
                {!meta.released ? (
                  <span className="mt-0.5 text-[12.5px] text-muted-foreground">Coming soon</span>
                ) : null}
              </span>
              <span
                aria-hidden
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                  selected ? "bg-primary text-primary-foreground" : "border-2 border-border",
                )}
              >
                {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3.2} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-start gap-2.5 rounded-md bg-accent p-3.5 text-[13.5px] leading-relaxed text-accent-foreground">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
        <span>
          Study content follows your <strong>{mediumLabel}</strong> medium — only the app&rsquo;s
          interface changes here.
        </span>
      </div>
    </section>
  );
}
