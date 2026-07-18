import Link from "next/link";

import type { Subject } from "@/features/academic-identity/types";
import { cn } from "@/lib/utils";

interface SubjectsGridProps {
  subjects: Subject[];
}

// Deterministic colour rotation. Order stays stable per subject as long as
// their sort order in the DB stays stable.
const TONE_STYLES = [
  { color: "#E5533C", tint: "rgba(229, 83, 60, 0.12)" },
  { color: "#5B5FDB", tint: "rgba(91, 95, 219, 0.12)" },
  { color: "#E8A13A", tint: "rgba(232, 161, 58, 0.12)" },
  { color: "#2FB57C", tint: "rgba(47, 181, 124, 0.12)" },
  { color: "#8B5CF6", tint: "rgba(139, 92, 246, 0.12)" },
];

function toneFor(index: number) {
  return TONE_STYLES[index % TONE_STYLES.length]!;
}

/**
 * Grid of the student's active subjects. Progress ring is a placeholder until
 * the (future) Notes / Study modules track per-subject completion. For now it
 * shows a static 0% so the layout is honest — it will populate once mastery
 * data flows in.
 */
export function SubjectsGrid({ subjects }: SubjectsGridProps) {
  if (subjects.length === 0) return null;

  return (
    <section aria-label="Subjects">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">Subjects</h2>
        <Link
          href="/app/notes"
          className="text-[13px] font-bold text-primary hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {subjects.map((subject, i) => (
          <SubjectCard key={subject.id} subject={subject} tone={toneFor(i)} />
        ))}
      </div>
    </section>
  );
}

function SubjectCard({
  subject,
  tone,
}: {
  subject: Subject;
  tone: { color: string; tint: string };
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-md text-[15px] font-extrabold"
          style={{ background: tone.tint, color: tone.color }}
          aria-hidden
        >
          {subject.name[0]}
        </span>
        <ProgressRing color={tone.color} pct={0} />
      </div>
      <div>
        <div className="text-[15px] font-bold leading-tight tracking-tight">
          {subject.name}
        </div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground/80">
          0 notes · 0%
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ color, pct }: { color: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 38 38"
      className="-rotate-90"
      role="img"
      aria-label={`${clamped}% complete`}
    >
      <circle
        cx="19"
        cy="19"
        r="15"
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="4"
      />
      <circle
        cx="19"
        cy="19"
        r="15"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${clamped} 100`}
      />
    </svg>
  );
}

/**
 * Deterministic reference to subject tones, exposed for other widgets to
 * colour-match subject chips against the grid.
 */
export const subjectTones = TONE_STYLES;
