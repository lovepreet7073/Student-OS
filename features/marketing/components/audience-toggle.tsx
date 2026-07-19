"use client";

import { GraduationCap, School } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { Audience } from "../types";

interface AudienceToggleProps {
  value: Audience;
  onChange: (value: Audience) => void;
  className?: string;
}

const OPTIONS: { key: Audience; icon: typeof GraduationCap }[] = [
  { key: "student", icon: GraduationCap },
  { key: "teacher", icon: School },
];

/**
 * Segmented control switching landing / auth copy between students & teachers.
 * The look stays constant — only words change (deck slide 2 rule).
 */
export function AudienceToggle({ value, onChange, className }: AudienceToggleProps) {
  const t = useTranslations("landing.audience");
  return (
    <div
      role="radiogroup"
      aria-label={t("student") + " / " + t("teacher")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span>{t(opt.key)}</span>
          </button>
        );
      })}
    </div>
  );
}
