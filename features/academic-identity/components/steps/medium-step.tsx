"use client";

import {
  SelectionCard,
  SelectionBadge,
  mediumBadgeTone,
} from "../selection-card";
import type { Medium } from "../../types";
import { StepHeading } from "./step-heading";

interface MediumStepProps {
  mediums: Medium[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// One-glyph "script mark" per locale for the badge (design pattern).
const localeGlyph: Record<string, string> = {
  en: "A",
  pa: "ੳ",
  hi: "अ",
};

export function MediumStep({ mediums, selectedId, onSelect }: MediumStepProps) {
  return (
    <section className="animate-step-in flex flex-col gap-6" role="radiogroup" aria-label="Medium">
      <StepHeading
        title="Pick your medium"
        description="Your study material — notes, papers and flashcards — will be in this language."
      />
      <div className="flex flex-col gap-3">
        {mediums.map((medium, i) => (
          <SelectionCard
            key={medium.id}
            selected={selectedId === medium.id}
            onSelect={() => onSelect(medium.id)}
            title={`${medium.name} Medium`}
            description={medium.nativeName ?? `Study content in ${medium.name}.`}
            badge={
              <SelectionBadge tone={mediumBadgeTone(i)}>
                {localeGlyph[medium.locale] ?? medium.name[0]}
              </SelectionBadge>
            }
          />
        ))}
      </div>
    </section>
  );
}
