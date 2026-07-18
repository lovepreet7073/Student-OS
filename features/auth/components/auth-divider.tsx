import type { ReactNode } from "react";

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex items-center gap-3">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
