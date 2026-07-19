"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface WizardFooterProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function WizardFooter({ label, onClick, disabled, loading }: WizardFooterProps) {
  const isDisabled = disabled || loading;

  return (
    <footer
      className={cn(
        "flex-shrink-0 border-t border-border px-4 pt-2.5 pb-safe sm:px-10 sm:pt-3",
        "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70",
      )}
    >
      <div className="mx-auto max-w-[640px] pb-2.5 sm:pb-3">
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[14.5px] font-bold text-primary-foreground transition-colors sm:h-12 sm:text-[15px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDisabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.5)] hover:bg-primary/90",
          )}
          aria-busy={loading || undefined}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {label}
        </button>
      </div>
    </footer>
  );
}
