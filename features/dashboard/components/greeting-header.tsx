import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { StreakBadge } from "@/components/layout/streak-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatar } from "@/components/layout/user-avatar";

interface GreetingHeaderProps {
  displayName: string;
  streakDays: number;
}

function greetingKey(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export async function GreetingHeader({ displayName, streakDays }: GreetingHeaderProps) {
  const t = await getTranslations("dashboard.greeting");
  const hour = new Date().getHours();
  const greeting = t(greetingKey(hour));
  const firstName = displayName.trim().split(/\s+/)[0] ?? displayName;

  return (
    <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
      <div className="mx-auto flex max-w-[780px] items-end justify-between gap-4 px-5 pb-3 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
        <div className="min-w-0 flex-shrink-0">
          <div className="text-[13px] font-semibold text-muted-foreground/80">{greeting}</div>
          <h1 className="mt-0.5 truncate text-[26px] font-extrabold leading-tight tracking-tight">
            {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <StreakBadge days={streakDays} />
          <ThemeToggle className="h-10 w-10 lg:hidden" />
          <Link
            href="/app/profile"
            aria-label="Go to profile"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <UserAvatar displayName={displayName} size="md" />
          </Link>
        </div>
      </div>
    </header>
  );
}
