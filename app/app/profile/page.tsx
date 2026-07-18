import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Download,
  HelpCircle,
  LogOut,
  Palette,
  UserCircle2,
} from "lucide-react";

import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { signOut } from "@/features/auth/actions/sign-out";

export const metadata: Metadata = { title: "Profile" };

interface SettingsRow {
  key: string;
  href?: string;
  action?: "sign-out";
  icon: typeof Bell;
  label: string;
  danger?: boolean;
}

const SETTINGS_ROWS: SettingsRow[] = [
  { key: "account",       icon: UserCircle2, label: "Account",           href: "#" },
  { key: "notifications", icon: Bell,        label: "Notifications",     href: "#" },
  { key: "downloads",     icon: Download,    label: "Offline downloads", href: "#" },
  { key: "appearance",    icon: Palette,     label: "Appearance",        href: "#" },
  { key: "help",          icon: HelpCircle,  label: "Help & support",    href: "#" },
  { key: "signout",       icon: LogOut,      label: "Sign out",          action: "sign-out", danger: true },
];

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-[780px] px-5 py-6 sm:px-7 sm:py-8 lg:max-w-[1140px] lg:px-11 lg:py-10">
      <header className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Profile</h1>
      </header>

      <section
        className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-card p-5"
        aria-label="Account"
      >
        <UserAvatar displayName={profile.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[19px] font-extrabold tracking-tight">
            {profile.displayName}
          </div>
          <div className="mt-0.5 truncate text-[13.5px] text-muted-foreground/80">
            {profile.email}
          </div>
          <div className="mt-1.5 text-xs font-semibold text-muted-foreground">
            {profile.board.shortName} · {profile.medium.name} Medium · Class {profile.classLevel.name}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding?edit=1">Edit</Link>
        </Button>
      </section>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {SETTINGS_ROWS.map((row, i) =>
          row.action === "sign-out" ? (
            <SignOutRow key={row.key} row={row} isFirst={i === 0} />
          ) : (
            <SettingsLink key={row.key} row={row} isFirst={i === 0} />
          ),
        )}
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-muted-foreground/70">
        StudyOS · v0.1 · Works offline
      </p>
    </div>
  );
}

function SettingsLink({ row, isFirst }: { row: SettingsRow; isFirst: boolean }) {
  const Icon = row.icon;
  return (
    <Link
      href={row.href ?? "#"}
      className={`flex min-h-[56px] items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-secondary ${
        !isFirst ? "border-t border-border" : ""
      }`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-primary"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <span className="flex-1 text-[15px] font-bold">{row.label}</span>
      <ChevronRight
        className="h-[18px] w-[18px] text-muted-foreground/70"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}

function SignOutRow({ row, isFirst }: { row: SettingsRow; isFirst: boolean }) {
  const Icon = row.icon;
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={`flex min-h-[56px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-danger/5 ${
          !isFirst ? "border-t border-border" : ""
        }`}
      >
        <span
          aria-hidden
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <span className="flex-1 text-[15px] font-bold text-danger">{row.label}</span>
      </button>
    </form>
  );
}
