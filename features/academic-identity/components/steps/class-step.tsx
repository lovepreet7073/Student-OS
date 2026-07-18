"use client";

import { ClassTile } from "../class-tile";
import type { ClassLevel } from "../../types";
import { StepHeading } from "./step-heading";

interface ClassStepProps {
  classes: ClassLevel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ClassStep({ classes, selectedId, onSelect }: ClassStepProps) {
  return (
    <section className="animate-step-in flex flex-col gap-6" role="radiogroup" aria-label="Class">
      <StepHeading
        title="What class are you in?"
        description="We'll load the right chapters and past papers for your class."
      />
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {classes.map((cls) => (
          <ClassTile
            key={cls.id}
            label={cls.name}
            selected={selectedId === cls.id}
            onSelect={() => onSelect(cls.id)}
          />
        ))}
      </div>
    </section>
  );
}
