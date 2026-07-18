"use client";

import type { Subject } from "@/features/academic-identity/types";
import { cn } from "@/lib/utils";

interface SubjectFilterChipsProps {
  subjects: Subject[];
  activeSubjectId: string | null;
  onChange: (subjectId: string | null) => void;
}

/**
 * Horizontal scrolling chip row. "All" chip resets the filter. On desktop it
 * still scrolls if the user has many subjects — no wrap, no line breaks.
 */
export function SubjectFilterChips({
  subjects,
  activeSubjectId,
  onChange,
}: SubjectFilterChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filter by subject"
    >
      <Chip label="All" active={activeSubjectId === null} onClick={() => onChange(null)} />
      {subjects.map((subject) => (
        <Chip
          key={subject.id}
          label={subject.name}
          active={activeSubjectId === subject.id}
          onClick={() => onChange(subject.id)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 flex-shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
