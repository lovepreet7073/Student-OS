"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { addCustomSubject } from "../../actions/add-custom-subject";
import { SubjectChip } from "../subject-chip";
import type { Subject } from "../../types";
import { StepHeading } from "./step-heading";

interface SubjectStepProps {
  subjects: Subject[];
  selectedIds: Set<string>;
  onToggle: (subjectId: string) => void;
  onCustomAdded: (subject: Subject) => void;
  loading: boolean;
  boardShortName: string;
  className: string;
  boardId: string;
  classId: string;
  mediumId: string;
}

export function SubjectStep({
  subjects,
  selectedIds,
  onToggle,
  onCustomAdded,
  loading,
  boardShortName,
  className,
  boardId,
  classId,
  mediumId,
}: SubjectStepProps) {
  const [draft, setDraft] = useState("");
  const [isAdding, startAdd] = useTransition();

  function handleAdd() {
    const name = draft.trim();
    if (name.length === 0) return;
    startAdd(async () => {
      const result = await addCustomSubject({ name, boardId, classId, mediumId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      onCustomAdded(result.data);
      setDraft("");
      toast.success(`Added ${result.data.name}`);
    });
  }

  return (
    <section className="animate-step-in flex flex-col gap-6" aria-label="Subjects">
      <StepHeading
        title="Choose your subjects"
        description={`We've pre-selected the usual ones for ${boardShortName} Class ${className}. Tap to adjust, or add your own below.`}
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
      ) : (
        <div className="flex flex-col gap-4">
          {subjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No standard subjects for this combination yet. Add your own below.
            </div>
          ) : (
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
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-card/40 p-3.5"
          >
            <label htmlFor="custom-subject" className="text-[12.5px] font-bold text-muted-foreground">
              Not in the list? Add your own
            </label>
            <div className="flex gap-2">
              <input
                id="custom-subject"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Sanskrit, Vocational Studies"
                enterKeyHint="done"
                maxLength={60}
                disabled={isAdding}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={draft.trim().length === 0 || isAdding}
                className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                )}
                Add
              </button>
            </div>
          </form>

          <div className="text-[13px] font-bold text-muted-foreground">
            {selectedIds.size} selected
          </div>
        </div>
      )}
    </section>
  );
}
