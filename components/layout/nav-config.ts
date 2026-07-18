import type { LucideIcon } from "lucide-react";
import { BarChart3, BookText, Home, Layers, UserCircle2 } from "lucide-react";

/**
 * The five destinations of the app shell. Order is the tab order in the
 * mobile bottom nav AND the desktop sidebar.
 *
 * Adding a new destination: append it here. Both nav renderings pick it up
 * automatically. Keep the list ≤ 5 items for mobile ergonomics.
 */
export interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: readonly NavItem[] = [
  { key: "home",     href: "/app/dashboard", label: "Home",     icon: Home },
  { key: "notes",    href: "/app/notes",     label: "Notes",    icon: BookText },
  { key: "study",    href: "/app/study",     label: "Study",    icon: Layers },
  { key: "progress", href: "/app/progress",  label: "Progress", icon: BarChart3 },
  { key: "profile",  href: "/app/profile",   label: "Profile",  icon: UserCircle2 },
] as const;

/**
 * Given a pathname, returns the key of the nav item that should be highlighted.
 * Uses prefix match so nested routes (e.g. `/app/notes/123`) still highlight `notes`.
 */
export function activeNavKey(pathname: string): string | null {
  const item = APP_NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return item?.key ?? null;
}
