"use client";

import { cn } from "@/lib/utils";

import { StepHeading } from "./step-heading";

export interface SummaryRow {
  label: string;
  value: string;
  editStep: number;
}

interface SummaryStepProps {
  rows: SummaryRow[];
  onEdit: (step: number) => void;
}

export function SummaryStep({ rows, onEdit }: SummaryStepProps) {
  return (
    <section className="animate-step-in flex flex-col gap-6" aria-label="Summary">
      <StepHeading
        title="All set — quick check"
        description="Everything look right? You can change any of this later in settings."
      />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center gap-3.5 p-4 sm:p-5",
              i > 0 && "border-t border-border",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {row.label}
              </div>
              <div className="mt-0.5 text-pretty text-[15.5px] font-bold">{row.value}</div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(row.editStep)}
              className="h-9 flex-shrink-0 rounded-md border border-border bg-secondary px-3.5 text-[13px] font-bold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
