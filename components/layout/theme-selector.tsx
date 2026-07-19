"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: { key: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { key: "light",  label: "Light",  icon: Sun },
  { key: "dark",   label: "Dark",   icon: Moon },
  { key: "system", label: "System", icon: Monitor },
];

/**
 * Segmented control for Light / Dark / System. Used inline in the profile
 * settings list so users on both mobile and desktop can toggle without
 * hunting for the icon toggle in the sidebar.
 *
 * next-themes returns undefined during SSR — we render a static shell until
 * mount to avoid hydration flicker.
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = mounted ? ((theme as ThemeChoice) ?? "system") : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary p-1"
    >
      {OPTIONS.map((opt) => {
        const on = active === opt.key;
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={opt.label}
            onClick={() => setTheme(opt.key)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[12.5px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
