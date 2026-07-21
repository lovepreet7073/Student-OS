import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BookText,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Timer,
  Trophy,
  Users,
  UserCircle2,
} from "lucide-react";

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
 * Secondary sidebar shortcuts (desktop-only, ADR-0029). These are NOT
 * primary destinations — the mobile bottom nav stays locked at 5 items.
 * On desktop they surface under a "Shortcuts" heading so students can
 * one-click into every content type without having to hop through
 * Workspace first.
 *
 * `label` is a plain English string (not a `labelKey`) because these
 * items haven't been added to the i18n `nav.*` namespace yet — Module
 * 13.5 will translate them in the general sweep.
 */
export interface ShortcutItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

export const APP_SHORTCUTS: readonly ShortcutItem[] = [
  { key: "library",      href: "/app/library",      label: "My Study Space", icon: FileText },
  { key: "tasks",        href: "/app/tasks",        label: "Tasks",          icon: ClipboardList },
  { key: "study",        href: "/app/study",        label: "AI Quizzes",     icon: BookOpen },
  { key: "flashcards",   href: "/app/flashcards",   label: "Flashcards",     icon: Layers },
  { key: "chat",         href: "/app/chat",         label: "AI Chat",        icon: MessageSquare },
  { key: "planner",      href: "/app/planner",      label: "Study Planner",  icon: Sparkles },
  { key: "tests",        href: "/app/tests",        label: "Test Evals",     icon: ClipboardCheck },
  { key: "syllabus",     href: "/app/syllabus",     label: "Syllabus",       icon: GraduationCap },
  { key: "calendar",     href: "/app/calendar",     label: "Calendar",       icon: CalendarClock },
  { key: "focus",        href: "/app/focus",        label: "Focus Timer",    icon: Timer },
  { key: "achievements", href: "/app/achievements", label: "Achievements",   icon: Trophy },
  { key: "help",         href: "/app/help",         label: "Helper",         icon: HelpCircle },
] as const;

export function activeShortcutKey(pathname: string): string | null {
  const item = APP_SHORTCUTS.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  return item?.key ?? null;
}
