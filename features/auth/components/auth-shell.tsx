import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { Logo } from "@/components/layout/logo";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Split-screen auth layout.
 * Mobile: single column, form takes full viewport height, logo top-left.
 * lg+: form on the left half, branded panel on the right.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-safe">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-10 sm:py-16">
          <div className="flex flex-col gap-3">
            <Logo priority variant="mark" size="lg" />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              {description ? (
                <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
              ) : null}
            </div>
          </div>
          <div>{children}</div>
          {footer ? <div className="text-center text-sm">{footer}</div> : null}
        </div>
      </div>

      <BrandPanel />
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-info p-12 lg:flex lg:items-center lg:justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent_70%)]"
      />
      <div className="relative flex max-w-md flex-col gap-8 text-primary-foreground">
        <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur w-fit">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          AI-powered study platform
        </div>
        <blockquote className="text-3xl font-medium leading-[1.2] tracking-tight">
          &ldquo;The AI planner cut my prep time in half. It&rsquo;s like having a study coach in my
          pocket.&rdquo;
        </blockquote>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/25" aria-hidden />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Ananya S.</span>
            <span className="text-xs opacity-70">Class 10 · Delhi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
