import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Bell,
  ChevronRight,
  Download,
  HelpCircle,
  LogOut,
  Palette,
  UserCircle2,
} from "lucide-react";

import { ThemeSelector } from "@/components/layout/theme-selector";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { signOut } from "@/features/auth/actions/sign-out";
import { listMyShares } from "@/features/community/actions/list-my-shares";
import { bucketByStatus } from "@/features/community/lib/bucket-shares";
import { MySharesSection } from "@/features/community/components/my-shares-section";

export const metadata: Metadata = { title: "Profile" };

type SettingsKey = "account" | "notifications" | "downloads" | "help" | "signOut";

interface SettingsRow {
  key: SettingsKey;
  href?: string;
  action?: "sign-out";
  icon: typeof Bell;
  danger?: boolean;
}

const SETTINGS_ROWS: SettingsRow[] = [
  { key: "account",       icon: UserCircle2, href: "#" },
  { key: "notifications", icon: Bell,        href: "#" },
  { key: "downloads",     icon: Download,    href: "#" },
  { key: "help",          icon: HelpCircle,  href: "#" },
  { key: "signOut",       icon: LogOut,      action: "sign-out", danger: true },
];

export default async function ProfilePage() {
  const [profile, sharesResult, t] = await Promise.all([
    getMyProfile(),
    listMyShares(),
    getTranslations("profile"),
  ]);
  if (!profile) return null;

  const shares = sharesResult.ok ? sharesResult.data : [];
  const shareBuckets = bucketByStatus(shares);

  return (
    <div className="mx-auto max-w-[780px] px-5 py-6 sm:px-7 sm:py-8 lg:max-w-[1140px] lg:px-11 lg:py-10">
      <header className="mb-6">
        <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">{t("title")}</h1>
      </header>

      <section
        className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-card p-5"
        aria-label={t("settings.account")}
      >
        <UserAvatar displayName={profile.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[19px] font-extrabold tracking-tight">
            {profile.displayName}
          </div>
          <div className="mt-0.5 truncate text-[13.5px] text-muted-foreground/80">
            {profile.email}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide ${
                profile.role === "teacher"
                  ? "bg-brand-accent/15 text-brand-accent"
                  : "bg-primary/12 text-primary"
              }`}
            >
              {profile.role === "teacher" ? t("roleTeacher") : t("roleStudent")}
            </span>
            <span>
              {profile.board.shortName} · {profile.medium.name} · {profile.classLevel.name}
            </span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding?edit=1">{t("editProfile")}</Link>
        </Button>
      </section>

      <section
        className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        aria-label={t("appearance")}
      >
        <span
          aria-hidden
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-primary"
        >
          <Palette className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold">{t("appearance")}</div>
          <div className="text-[12.5px] text-muted-foreground">{t("appearanceHint")}</div>
        </div>
        <ThemeSelector />
      </section>

      <MySharesSection buckets={shareBuckets} />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {SETTINGS_ROWS.map((row, i) => {
          const label = t(`settings.${row.key}`);
          return row.action === "sign-out" ? (
            <SignOutRow key={row.key} row={row} isFirst={i === 0} label={label} />
          ) : (
            <SettingsLink key={row.key} row={row} isFirst={i === 0} label={label} />
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-muted-foreground/70">
        {t("versionLine")}
      </p>
    </div>
  );
}

function SettingsLink({
  row,
  isFirst,
  label,
}: {
  row: SettingsRow;
  isFirst: boolean;
  label: string;
}) {
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
      <span className="flex-1 text-[15px] font-bold">{label}</span>
      <ChevronRight
        className="h-[18px] w-[18px] text-muted-foreground/70"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}

function SignOutRow({
  row,
  isFirst,
  label,
}: {
  row: SettingsRow;
  isFirst: boolean;
  label: string;
}) {
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
        <span className="flex-1 text-[15px] font-bold text-danger">{label}</span>
      </button>
    </form>
  );
}
