"use client";

import { Check } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

interface WizardRailStep {
  n: number;
  label: string;
  done: boolean;
  active: boolean;
  onSelect: () => void;
}

interface WizardRailProps {
  steps: WizardRailStep[];
}

export function WizardRail({ steps }: WizardRailProps) {
  return (
    <aside className="hidden flex-col border-r border-border bg-card px-6 py-8 lg:flex">
      <div className="mb-11 flex items-center gap-3">
        <Logo variant="mark" size="md" href={null} />
        <span className="text-[19px] font-extrabold tracking-tight">StudyOS</span>
      </div>
      <div className="mb-5 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
        Academic setup
      </div>
      <nav className="flex flex-col gap-1">
        {steps.map((step) => (
          <button
            key={step.n}
            type="button"
            onClick={step.onSelect}
            aria-current={step.active ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-3 text-left text-[14.5px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              step.active && "bg-accent text-accent-foreground",
              !step.active && step.done && "text-foreground",
              !step.active && !step.done && "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold transition-colors",
                (step.done || step.active) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={3.2} /> : step.n}
            </span>
            <span>{step.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
