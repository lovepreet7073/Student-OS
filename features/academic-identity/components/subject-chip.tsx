"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface SubjectChipProps {
  name: string;
  selected: boolean;
  onToggle: () => void;
}

export function SubjectChip({ name, selected, onToggle }: SubjectChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-2 rounded-full text-[14.5px] font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-2 border-primary bg-accent px-4 py-2 pl-3 text-accent-foreground"
          : "border border-border bg-card px-4 py-3 text-foreground hover:border-primary/40",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors",
          selected ? "bg-primary text-primary-foreground" : "border-2 border-border",
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3.4} /> : null}
      </span>
      {name}
    </button>
  );
}
