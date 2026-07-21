"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookText,
  CalendarClock,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  LayoutGrid,
  MessageSquare,
  Search,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { globalSearch } from "@/features/search/actions/search";
import type { SearchHit } from "@/features/search/types";
import { cn } from "@/lib/utils";

/**
 * ⌘K / Ctrl+K command palette. Fastest path from anywhere in the app
 * to any surface or piece of content.
 *
 * Two modes based on input:
 *   - Empty input   → shows "Jump to" navigation shortcuts (Today,
 *     Library, Practice, etc.) and a "Ask AI" quick action.
 *   - Any query     → runs the same globalSearch action `/app/search`
 *     uses, groups results by entity type, and lists them.
 *
 * Keyboard model: ↑ / ↓ move the highlight, Enter opens the highlighted
 * row, Escape closes. Mouse is the fallback — hover updates the
 * highlight so keyboard/mouse can be mixed.
 *
 * The palette replaces the previous "Cmd+K = navigate to /app/search"
 * behaviour we shipped in Module 56. That was a stopgap; this is the
 * real thing.
 */

interface Command {
  key: string;
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
}

const NAV_COMMANDS: Command[] = [
  { key: "today",      href: "/app/dashboard",         label: "Today",           icon: Home,          hint: "Your daily briefing" },
  { key: "workspace",  href: "/app/workspace",         label: "Workspace",       icon: LayoutGrid,    hint: "Directory of every feature" },
  { key: "library",    href: "/app/notes",             label: "Library",         icon: BookText,      hint: "Notes + files in one place" },
  { key: "files",      href: "/app/notes?view=files",  label: "Files",           icon: FileText,      hint: "Uploaded PDFs and photos" },
  { key: "practice",   href: "/app/practice",          label: "Practice",        icon: Layers,        hint: "Flashcards, quizzes, tests" },
  { key: "chat",       href: "/app/chat",              label: "AI Chat",         icon: MessageSquare, hint: "Streaming syllabus tutor" },
  { key: "askai",      href: "/app/chat/new",          label: "Ask AI",          icon: Sparkles,      hint: "New chat with the AI" },
  { key: "tasks",      href: "/app/tasks",             label: "Tasks",           icon: ClipboardList, hint: "To-dos with due dates" },
  { key: "calendar",   href: "/app/calendar",          label: "Calendar",        icon: CalendarClock, hint: "Agenda for the next 30 days" },
  { key: "syllabus",   href: "/app/syllabus",          label: "Syllabus",        icon: GraduationCap, hint: "Chapters view" },
  { key: "community",  href: "/app/community",         label: "Community",       icon: Users,         hint: "Peer notes and shares" },
  { key: "helper",     href: "/app/help",              label: "StudyOS Helper",  icon: HelpCircle,    hint: "How do I…?" },
  { key: "profile",    href: "/app/profile",           label: "Profile",         icon: UserCircle2,   hint: "Board, class, subjects" },
];

const ENTITY_ICON: Record<SearchHit["entityType"], LucideIcon> = {
  note: BookText,
  file: FileText,
  task: ClipboardList,
  community_note: Users,
};

const ENTITY_LABEL: Record<SearchHit["entityType"], string> = {
  note: "Note",
  file: "File",
  task: "Task",
  community_note: "Community",
};

interface Row {
  key: string;
  href: string;
  primary: string;
  secondary: string;
  icon: LucideIcon;
  group: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [pending, setPending] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter nav commands by query when in nav mode.
  const filteredNav = useMemo(() => {
    if (query.trim().length === 0) return NAV_COMMANDS;
    const q = query.trim().toLowerCase();
    return NAV_COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint?.toLowerCase().includes(q) ||
        false,
    );
  }, [query]);

  // Only run globalSearch when the query has real length.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setPending(false);
      return;
    }
    setPending(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await globalSearch(q);
      if (!res.ok) {
        setHits([]);
        setPending(false);
        return;
      }
      setHits([
        ...res.data.notes,
        ...res.data.files,
        ...res.data.tasks,
        ...res.data.community,
      ]);
      setPending(false);
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query]);

  // Flatten every visible row so ↑/↓/Enter works on one list.
  const rows: Row[] = useMemo(() => {
    const commands: Row[] = filteredNav.map((c) => ({
      key: `nav:${c.key}`,
      href: c.href,
      primary: c.label,
      secondary: c.hint ?? "",
      icon: c.icon,
      group: "Jump to",
    }));
    const results: Row[] = hits.map((h) => ({
      key: `hit:${h.id}`,
      href: h.href,
      primary: h.title || "Untitled",
      secondary: h.subjectName ?? h.snippet.slice(0, 90),
      icon: ENTITY_ICON[h.entityType],
      group: ENTITY_LABEL[h.entityType],
    }));
    return [...commands, ...results];
  }, [filteredNav, hits]);

  // Reset when reopened.
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlighted(0);
      setHits([]);
    }
  }, [open]);

  // Clamp highlight when rows shrink.
  useEffect(() => {
    if (highlighted >= rows.length) setHighlighted(Math.max(0, rows.length - 1));
  }, [rows.length, highlighted]);

  const jump = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  // Global ⌘K / Ctrl+K listener — replaces the earlier navigate-to-search
  // behaviour from Module 56.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // Only intercept if not typing in a native search input.
        const target = e.target as HTMLElement | null;
        if (
          target instanceof HTMLInputElement &&
          target.type === "search"
        ) {
          return;
        }
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(rows.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = rows[highlighted];
      if (target) jump(target.href);
    }
  }

  // Group rows by their `group` for section headings while preserving
  // the flat index for keyboard highlight.
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    }
    return Array.from(map.entries());
  }, [rows]);

  // Row index lookup so we can highlight the correct row across groups.
  const rowIndex = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r, i) => map.set(r.key, i));
    return map;
  }, [rows]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-[560px] -translate-x-1/2 rounded-2xl border border-border bg-card shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Search and jump to
          </DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search
              className="h-4 w-4 flex-shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search notes, files, tasks — or jump to a page…"
              enterKeyHint="go"
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10.5px] font-bold text-muted-foreground sm:inline">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {rows.length === 0 ? (
              <div className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                {pending
                  ? "Searching…"
                  : query.trim().length >= 2
                    ? `No matches for "${query.trim()}"`
                    : "Nothing to show. Type to search."}
              </div>
            ) : (
              grouped.map(([group, groupRows]) => (
                <div key={group} className="mb-1 last:mb-0">
                  <div className="px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {groupRows.map((r) => {
                      const idx = rowIndex.get(r.key) ?? -1;
                      const isActive = idx === highlighted;
                      const Icon = r.icon;
                      return (
                        <li key={r.key}>
                          <Link
                            href={r.href}
                            onMouseEnter={() => setHighlighted(idx)}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground hover:bg-muted",
                            )}
                          >
                            <Icon
                              className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate font-bold">
                                {r.primary}
                              </span>
                              {r.secondary ? (
                                <span className="truncate text-[11.5px] text-muted-foreground">
                                  {r.secondary}
                                </span>
                              ) : null}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="mr-1 rounded bg-muted px-1 py-0.5 text-[10px] font-bold">
                ↑↓
              </kbd>
              navigate
              <kbd className="mx-1 rounded bg-muted px-1 py-0.5 text-[10px] font-bold">
                ↵
              </kbd>
              open
            </span>
            <span>
              <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-bold">
                ⌘K
              </kbd>{" "}
              toggle
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
