import { ChevronRight } from "lucide-react";

interface ContinueHeroProps {
  chapterTitle: string;
  subjectName: string;
  chapterIndex: number;
  progressPct: number;
  onResume?: () => void;
}

/**
 * Primary "continue where you left off" card. Falls back to encouraging copy
 * when there's no in-progress chapter. Data source is TBD — likely the
 * (future) study-session tracker or last-opened note.
 */
export function ContinueHero({
  chapterTitle,
  subjectName,
  chapterIndex,
  progressPct,
  onResume,
}: ContinueHeroProps) {
  const clamped = Math.max(0, Math.min(100, progressPct));

  return (
    <section
      className="rounded-xl bg-primary p-5 text-primary-foreground shadow-[0_14px_34px_-14px_hsl(var(--primary)/0.6)] sm:p-6"
      aria-label="Continue studying"
    >
      <div className="text-[12px] font-bold uppercase tracking-[0.06em] opacity-80">
        Continue studying
      </div>
      <div className="mt-2 text-[22px] font-extrabold leading-tight tracking-tight">
        {chapterTitle}
      </div>
      <div className="mt-1 text-sm opacity-85">
        {subjectName} · Chapter {chapterIndex}
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-white" style={{ width: `${clamped}%` }} />
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <span className="text-[13px] opacity-85">{clamped}% complete</span>
        <button
          type="button"
          onClick={onResume}
          className="inline-flex h-11 items-center gap-1.5 rounded-md bg-white px-5 text-[15px] font-bold text-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Resume
          <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    </section>
  );
}
