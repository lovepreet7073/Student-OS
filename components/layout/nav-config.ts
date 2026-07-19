import type { LucideIcon } from "lucide-react";
import { BookText, Home, LayoutGrid, Users, UserCircle2 } from "lucide-react";

/**
 * The five destinations of the app shell. Order is the tab order in the
 * mobile bottom nav AND the desktop sidebar. Keep the list ≤ 5 for mobile
 * ergonomics.
 *
 * Dashboard + Workspace are peer top-level destinations. Dashboard is the
 * "today" view (greeting, continue, plan, week). Workspace is the "storage"
 * view (all content categories + recent activity). Study/Quizzes is
 * discoverable via a tile inside Workspace.
 *
 * `labelKey` is a key inside the `nav.*` namespace of the i18n dictionary —
 * the renderer resolves it via `useTranslations('nav')`. Callers must never
 * inline English strings here.
 */
export interface NavItem {
  key: string;
  href: string;
  labelKey: "dashboard" | "workspace" | "notes" | "community" | "profile";
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: readonly NavItem[] = [
  { key: "dashboard", href: "/app/dashboard", labelKey: "dashboard", icon: Home },
  { key: "workspace", href: "/app/workspace", labelKey: "workspace", icon: LayoutGrid },
  { key: "notes",     href: "/app/notes",     labelKey: "notes",     icon: BookText },
  { key: "community", href: "/app/community", labelKey: "community", icon: Users },
  { key: "profile",   href: "/app/profile",   labelKey: "profile",   icon: UserCircle2 },
] as const;

/**
 * Given a pathname, returns the key of the nav item that should be highlighted.
 * Uses prefix match so nested routes (e.g. `/app/notes/123`) still highlight `notes`.
 */
export function activeNavKey(pathname: string): string | null {
  const item = APP_NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return item?.key ?? null;
}
