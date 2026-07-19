"use client";

import { GraduationCap, School } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/features/academic-identity/types";

interface AudiencePickerProps {
  value: UserRole;
  onChange: (value: UserRole) => void;
  className?: string;
}

const OPTIONS: { key: UserRole; icon: typeof GraduationCap }[] = [
  { key: "student", icon: GraduationCap },
  { key: "teacher", icon: School },
];

/**
 * Audience picker for the top of the sign-up form (deck slide 6).
 * Two large cards that flip between student and teacher copy. Persists to
 * user_metadata.role → user_preferences.user_role during onboarding.
 */
export function AudiencePicker({ value, onChange, className }: AudiencePickerProps) {
  const t = useTranslations("auth.signup");
  return (
    <div
      role="radiogroup"
      aria-label={t("description")}
      className={cn("grid grid-cols-2 gap-3", className)}
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
              "flex min-h-[92px] flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary bg-accent"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="text-[13.5px] font-extrabold tracking-tight">{t(opt.key)}</span>
            <span className="text-[11.5px] leading-snug text-muted-foreground">
              {t(`${opt.key}Helper`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
