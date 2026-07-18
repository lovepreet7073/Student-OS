import Link from "next/link";

import { StreakBadge } from "@/components/layout/streak-badge";
import { UserAvatar } from "@/components/layout/user-avatar";

interface GreetingHeaderProps {
  displayName: string;
  streakDays: number;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function GreetingHeader({ displayName, streakDays }: GreetingHeaderProps) {
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
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
