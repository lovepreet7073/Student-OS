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
        "flex-shrink-0 border-t border-border px-4 pt-2 pb-safe sm:px-10 sm:pt-2.5",
        "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70",
      )}
    >
      <div className="mx-auto max-w-[640px] pb-2 sm:pb-2.5">
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            // Full width on mobile (thumb-reach), auto-width on desktop so
            // the CTA feels like a button, not a bar. 44px on mobile keeps
            // the tap target legal; 40px on desktop is denser.
            "flex h-11 w-full items-center justify-center gap-2 rounded-md text-[14px] font-bold text-primary-foreground transition-colors",
            "sm:mx-auto sm:h-10 sm:w-auto sm:min-w-[200px] sm:px-8 sm:text-[14px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDisabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary shadow-[0_6px_16px_-10px_hsl(var(--primary)/0.5)] hover:bg-primary/90",
          )}
          aria-busy={loading || undefined}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          {label}
        </button>
      </div>
    </footer>
  );
}
