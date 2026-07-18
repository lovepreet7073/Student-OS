"use client";

import { Loader2 } from "lucide-react";

import { SubjectChip } from "../subject-chip";
import type { Subject } from "../../types";
import { StepHeading } from "./step-heading";

interface SubjectStepProps {
  subjects: Subject[];
  selectedIds: Set<string>;
  onToggle: (subjectId: string) => void;
  loading: boolean;
  boardShortName: string;
  className: string;
}

export function SubjectStep({
  subjects,
  selectedIds,
  onToggle,
  loading,
  boardShortName,
  className,
}: SubjectStepProps) {
  return (
    <section className="animate-step-in flex flex-col gap-6" aria-label="Subjects">
      <StepHeading
        title="Choose your subjects"
        description={`We've pre-selected the usual ones for ${boardShortName} Class ${className}. Tap to adjust.`}
      />

      {loading ? (
        <div
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading subjects…
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No subjects available for this combination yet. Please contact support.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2.5">
            {subjects.map((s) => (
              <SubjectChip
                key={s.id}
                name={s.name}
                selected={selectedIds.has(s.id)}
                onToggle={() => onToggle(s.id)}
              />
            ))}
          </div>
          <div className="text-[13px] font-bold text-muted-foreground">
            {selectedIds.size} selected
          </div>
        </>
      )}
    </section>
  );
}
