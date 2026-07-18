"use client";

import {
  SelectionCard,
  SelectionBadge,
  boardBadgeTone,
} from "../selection-card";
import type { Board } from "../../types";
import { StepHeading } from "./step-heading";

interface BoardStepProps {
  boards: Board[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BoardStep({ boards, selectedId, onSelect }: BoardStepProps) {
  return (
    <section className="animate-step-in flex flex-col gap-6" role="radiogroup" aria-label="Board">
      <StepHeading
        title="Which board are you studying?"
        description="This tailors your notes, papers and AI answers to the right syllabus."
      />
      <div className="flex flex-col gap-3">
        {boards.map((board, i) => (
          <SelectionCard
            key={board.id}
            selected={selectedId === board.id}
            onSelect={() => onSelect(board.id)}
            title={board.shortName}
            description={board.name}
            badge={<SelectionBadge tone={boardBadgeTone(i)}>{board.shortName}</SelectionBadge>}
          />
        ))}
      </div>
    </section>
  );
}
