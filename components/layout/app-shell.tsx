import type { ReactNode } from "react";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface AppShellProps {
  children: ReactNode;
}

/**
 * The chrome that wraps every `/app/*` route.
 *
 * Mobile (< lg): full-width content + fixed bottom nav. Content gets
 *   padding-bottom to account for nav height + safe-area.
 * Desktop (lg+): 250px sticky sidebar on the left, content takes the rest.
 *
 * The shell does not inject topbars — each page composes its own sticky
 * header inside the `<main>` scroll area, matching per-screen designs.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[250px_1fr]">
      <DesktopSidebar />
      <main className="min-w-0 pb-[calc(66px+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
