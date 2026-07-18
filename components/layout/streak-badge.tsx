import { Flame } from "lucide-react";

interface StreakBadgeProps {
  days: number;
}

/**
 * Small pill showing the user's current study streak. Sits next to the avatar
 * in the greeting header. Fed by the (future) streak feature — for now, the
 * dashboard passes a static placeholder until the tracking module ships.
 */
export function StreakBadge({ days }: StreakBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-bold"
      aria-label={`${days} day streak`}
    >
      <Flame className="h-[17px] w-[17px] fill-[#F0803C] text-[#F0803C]" />
      {days}
    </span>
  );
}
