interface WeekStat {
  label: string;
  value: string;
}

interface WeekStatsProps {
  stats: WeekStat[];
}

/**
 * 3-up stats strip for the home screen ("Study time / Cards / Focus").
 * Values are stubbed by the parent until the (future) analytics module lands.
 */
export function WeekStats({ stats }: WeekStatsProps) {
  return (
    <section aria-label="This week">
      <h2 className="mb-3.5 text-lg font-extrabold tracking-tight">This week</h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card px-3 py-3.5 text-center"
          >
            <div className="text-xl font-extrabold tracking-tight">{stat.value}</div>
            <div className="mt-0.5 text-xs font-semibold text-muted-foreground/80">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
