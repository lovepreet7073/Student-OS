import Link from "next/link";
import { CalendarClock, ClipboardList, Sparkles } from "lucide-react";

import type { CalendarAgenda, CalendarEventType } from "../actions/get-calendar-agenda";

interface Props {
  agenda: CalendarAgenda;
}

const TYPE_META: Record<
  CalendarEventType,
  { icon: typeof CalendarClock; label: string; tone: string; ring: string }
> = {
  exam: {
    icon: CalendarClock,
    label: "Exam",
    tone: "bg-danger/12 text-danger",
    ring: "border-danger/40",
  },
  task: {
    icon: ClipboardList,
    label: "Task",
    tone: "bg-warning/15 text-warning",
    ring: "border-warning/40",
  },
  study_session: {
    icon: Sparkles,
    label: "Study",
    tone: "bg-primary/10 text-primary",
    ring: "border-primary/40",
  },
};

export function CalendarAgendaView({ agenda }: Props) {
  const daysWithEvents = agenda.days.filter((d) => d.events.length > 0);

  if (daysWithEvents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
        <div className="text-[14px] font-bold">Nothing on the calendar</div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Exams, tasks, and study-plan sessions will show up here as you add them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {daysWithEvents.map((day) => (
        <section key={day.date} aria-label={day.date} className="flex gap-3">
          <div className="flex flex-shrink-0 flex-col items-center pt-1">
            <div
              className={
                day.isToday
                  ? "flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground"
                  : "flex h-11 w-11 flex-col items-center justify-center rounded-lg border border-border bg-card"
              }
            >
              <span className="text-[10.5px] font-bold uppercase leading-none">
                {day.weekday}
              </span>
              <span className="mt-0.5 text-[15px] font-extrabold leading-none">
                {parseInt(day.date.slice(8, 10), 10)}
              </span>
            </div>
            {day.isToday ? (
              <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-primary">
                Today
              </span>
            ) : null}
          </div>

          <ul className="flex min-w-0 flex-1 flex-col gap-2">
            {day.events.map((event) => {
              const meta = TYPE_META[event.type];
              return (
                <li key={event.id}>
                  <Link
                    href={event.href}
                    className={`flex items-center gap-3 rounded-lg border ${meta.ring} bg-card p-3 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${meta.tone}`}
                    >
                      <meta.icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold">{event.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
                        <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                          {meta.label}
                        </span>
                        {event.subtitle ? <span>{event.subtitle}</span> : null}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
