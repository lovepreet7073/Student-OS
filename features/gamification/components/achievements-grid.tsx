import { Trophy } from "lucide-react";

import type { Badge } from "../lib/achievements";
import { AchievementCard } from "./achievement-card";

interface AchievementsGridProps {
  badges: Badge[];
}

export function AchievementsGrid({ badges }: AchievementsGridProps) {
  const earned = badges.filter((b) => b.earned);
  const upcoming = badges.filter((b) => !b.earned);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="earned-title">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" aria-hidden />
          <h2
            id="earned-title"
            className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Earned · {earned.length}
          </h2>
        </div>
        {earned.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
            <div className="text-[13.5px] font-bold">No badges yet</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Keep studying — your first badge is a step away.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earned.map((badge) => (
              <AchievementCard key={badge.key} badge={badge} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 ? (
        <section aria-labelledby="upcoming-title">
          <div className="mb-3 flex items-center gap-2">
            <h2
              id="upcoming-title"
              className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Up next · {upcoming.length}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {upcoming.map((badge) => (
              <AchievementCard key={badge.key} badge={badge} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
