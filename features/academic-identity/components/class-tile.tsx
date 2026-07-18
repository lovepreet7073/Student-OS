"use client";

import { cn } from "@/lib/utils";

interface ClassTileProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function ClassTile({ label, selected, onSelect }: ClassTileProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg text-2xl font-extrabold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-2 border-primary bg-primary text-primary-foreground"
          : "border border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {label}
    </button>
  );
}
