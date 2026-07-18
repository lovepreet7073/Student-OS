"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { useAcademicProfile } from "@/features/academic-identity/hooks/use-academic-profile";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { APP_NAV_ITEMS, activeNavKey } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar } from "./user-avatar";

export function DesktopSidebar() {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);
  const profile = useAcademicProfile();

  return (
    <aside className="sticky top-0 hidden h-svh flex-col justify-between border-r border-border bg-card px-4 py-6 lg:flex">
      <div className="flex flex-col gap-6">
        <div className="px-2">
          <Logo variant="full" size="md" href="/app/dashboard" />
        </div>

        <nav className="flex flex-col gap-1" aria-label="Primary">
          {APP_NAV_ITEMS.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-[15px] font-bold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/app/notes"
          className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          New note
        </Link>

        <div className="flex items-center justify-between gap-2">
          <Link
            href="/app/profile"
            className="flex flex-1 items-center gap-3 rounded-md bg-secondary p-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar displayName={profile.displayName} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold leading-tight">
                {profile.displayName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Class {profile.classLevel.name} · {profile.board.shortName}
              </span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
