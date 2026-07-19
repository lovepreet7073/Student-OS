import { Star } from "lucide-react";

const STATS = [
  { key: "students", value: "12k+", label: "students" },
  { key: "teachers", value: "800+", label: "teachers" },
  { key: "rating",   value: "4.8", label: "rated", star: true },
];

export function LandingSocialProof() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-border bg-card/60 px-6 py-4 text-center"
      aria-label="Community stats"
    >
      {STATS.map((s) => (
        <div key={s.key} className="flex items-baseline gap-1.5">
          <span className="text-[19px] font-extrabold tracking-tight text-foreground">
            {s.value}
          </span>
          {s.star ? (
            <Star
              className="h-3.5 w-3.5 fill-warning text-warning"
              strokeWidth={0}
              aria-hidden
            />
          ) : null}
          <span className="text-[12.5px] font-semibold text-muted-foreground">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
