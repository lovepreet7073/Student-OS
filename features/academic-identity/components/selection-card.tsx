import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectionCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  selected: boolean;
  badge?: React.ReactNode;
  title: string;
  description?: string;
  onSelect: () => void;
}

/**
 * The "large radio card" pattern used across the onboarding wizard.
 * Selected state: 2px primary border + accent tint bg + primary check circle.
 */
export const SelectionCard = React.forwardRef<HTMLButtonElement, SelectionCardProps>(
  function SelectionCard(
    { selected, badge, title, description, onSelect, className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-4 rounded-lg bg-card p-4 text-left transition-colors",
          "min-h-[64px]",
          selected
            ? "border-2 border-primary bg-accent"
            : "border border-border hover:border-primary/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
        {...props}
      >
        {badge}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-bold leading-tight">{title}</span>
          {description ? (
            <span className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors",
            selected ? "bg-primary text-primary-foreground" : "border-2 border-border",
          )}
        >
          {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3.2} /> : null}
        </span>
      </button>
    );
  },
);

interface SelectionBadgeProps {
  tone: "indigo" | "coral" | "green" | "amber" | "violet";
  children: React.ReactNode;
}

const badgeTones: Record<SelectionBadgeProps["tone"], string> = {
  indigo: "bg-primary/12 text-primary",
  coral: "bg-danger/12 text-danger",
  green: "bg-success/12 text-success",
  amber: "bg-warning/12 text-warning",
  violet: "bg-[#8B5CF6]/12 text-[#8B5CF6]",
};

export function SelectionBadge({ tone, children }: SelectionBadgeProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-[15px] font-extrabold",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const boardBadgeCycle: SelectionBadgeProps["tone"][] = [
  "coral",
  "indigo",
  "green",
  "amber",
  "violet",
];

export function boardBadgeTone(index: number): SelectionBadgeProps["tone"] {
  return boardBadgeCycle[index % boardBadgeCycle.length] ?? "indigo";
}

const mediumBadgeCycle: SelectionBadgeProps["tone"][] = ["indigo", "coral", "amber"];

export function mediumBadgeTone(index: number): SelectionBadgeProps["tone"] {
  return mediumBadgeCycle[index % mediumBadgeCycle.length] ?? "indigo";
}
