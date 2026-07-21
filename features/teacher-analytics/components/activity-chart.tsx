import type { DailyBucket } from "../actions/get-daily-activity";

interface Props {
  buckets: DailyBucket[];
}

/**
 * A no-library stacked bar chart. Renders one column per day; each column
 * has a green "approved" segment stacked on a red "rejected" segment. The
 * column height is proportional to the max total across all days.
 *
 * Design constraints:
 *   - No client JS. Server-rendered SVG only.
 *   - No axes/legend inside the SVG — text labels sit above and below in
 *     regular HTML for accessibility.
 *   - Empty state renders when no day has any activity.
 */
export function ActivityChart({ buckets }: Props) {
  const max = buckets.reduce((m, b) => Math.max(m, b.approved + b.rejected), 0);

  if (max === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
        No moderation activity in the last {buckets.length} days.
      </p>
    );
  }

  const totalApproved = buckets.reduce((s, b) => s + b.approved, 0);
  const totalRejected = buckets.reduce((s, b) => s + b.rejected, 0);

  const w = 600;
  const h = 120;
  const gap = 2;
  const barWidth = (w - gap * (buckets.length - 1)) / buckets.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11.5px] font-semibold text-muted-foreground">
        <span>{buckets[0]?.day.slice(5) ?? ""}</span>
        <span className="text-[11px]">
          <span className="mr-2">
            <span
              aria-hidden
              className="mr-1 inline-block h-2 w-2 rounded-sm bg-success align-middle"
            />
            Approved {totalApproved}
          </span>
          <span>
            <span
              aria-hidden
              className="mr-1 inline-block h-2 w-2 rounded-sm bg-danger align-middle"
            />
            Rejected {totalRejected}
          </span>
        </span>
        <span>{buckets[buckets.length - 1]?.day.slice(5) ?? ""}</span>
      </div>
      <svg
        role="img"
        aria-label={`Daily moderation activity for the last ${buckets.length} days`}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full text-transparent"
        preserveAspectRatio="none"
      >
        {buckets.map((b, i) => {
          const x = i * (barWidth + gap);
          const totalH = ((b.approved + b.rejected) / max) * h;
          const approvedH = (b.approved / max) * h;
          const rejectedH = (b.rejected / max) * h;
          return (
            <g key={b.day}>
              <title>{`${b.day}: ${b.approved} approved, ${b.rejected} rejected`}</title>
              <rect
                x={x}
                y={h - rejectedH}
                width={barWidth}
                height={rejectedH}
                className="fill-danger"
                rx={1}
              />
              <rect
                x={x}
                y={h - totalH}
                width={barWidth}
                height={approvedH}
                className="fill-success"
                rx={1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
