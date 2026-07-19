interface PlanProgressBarProps {
  completed: number;
  total: number;
}

export function PlanProgressBar({ completed, total }: PlanProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex flex-col gap-1.5" aria-label={`${completed} of ${total} sessions complete`}>
      <div className="flex items-center justify-between text-[12.5px] font-bold">
        <span className="text-muted-foreground">Progress</span>
        <span className="text-foreground">
          {completed} / {total} · {pct}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
