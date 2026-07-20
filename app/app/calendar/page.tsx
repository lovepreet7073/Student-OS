import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { getCalendarAgenda } from "@/features/calendar/actions/get-calendar-agenda";
import { CalendarAgendaView } from "@/features/calendar/components/calendar-agenda-view";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const result = await getCalendarAgenda({ days: 30 });

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto max-w-[780px] px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:px-11 lg:pt-6">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-primary">
            <CalendarDays className="h-3 w-3" strokeWidth={2.4} aria-hidden />
            Next 30 days
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Calendar</h1>
          {result.ok ? (
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {result.data.totalEvents}{" "}
              {result.data.totalEvents === 1 ? "event" : "events"} across exams, tasks and study
              sessions.
            </p>
          ) : null}
        </div>
      </header>

      <section aria-label="Agenda" className="pt-5">
        {!result.ok ? (
          <ErrorState title="Couldn't load your calendar" description={result.error.message} />
        ) : (
          <CalendarAgendaView agenda={result.data} />
        )}
      </section>
    </div>
  );
}
