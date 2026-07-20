"use client";

import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Subject } from "@/features/academic-identity/types";

import type { Exam } from "../types";
import { ExamManageDialog } from "./exam-manage-dialog";

interface Props {
  exams: Exam[];
  subjects: Subject[];
}

/**
 * Dashboard widget: shows the next upcoming exam as a big countdown, with
 * a compact list of the following 2-3 exams. "Manage" opens a dialog to
 * add/delete exams — no separate settings page needed for MVP.
 */
export function ExamCountdownCard({ exams, subjects }: Props) {
  const [manageOpen, setManageOpen] = useState(false);

  const [next, ...rest] = exams;

  return (
    <section
      aria-label="Exam countdown"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-md bg-warning/15 text-warning"
          >
            <CalendarClock className="h-4 w-4" strokeWidth={2} />
          </span>
          <h2 className="text-[15px] font-extrabold tracking-tight">Exams</h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setManageOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-3 w-3" strokeWidth={2.4} aria-hidden />
          {exams.length === 0 ? "Add" : "Manage"}
        </Button>
      </div>

      {next ? (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-[42px] font-extrabold leading-none tracking-tight tabular-nums sm:text-[48px] ${
                  next.daysUntil <= 3
                    ? "text-danger"
                    : next.daysUntil <= 7
                      ? "text-warning"
                      : "text-primary"
                }`}
              >
                {next.daysUntil === 0 ? "Today" : next.daysUntil}
              </span>
              {next.daysUntil !== 0 ? (
                <span className="text-[13px] font-bold text-muted-foreground">
                  {next.daysUntil === 1 ? "day away" : "days away"}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
              <span>{next.name}</span>
              {next.subjectName ? (
                <span className="text-muted-foreground">· {next.subjectName}</span>
              ) : null}
              <span className="text-muted-foreground">· {formatExamDate(next.examDate)}</span>
            </div>
          </div>

          {rest.length > 0 ? (
            <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
              {rest.slice(0, 3).map((exam) => (
                <li
                  key={exam.id}
                  className="flex items-center justify-between gap-3 text-[12.5px]"
                >
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {exam.name}
                    {exam.subjectName ? (
                      <span className="ml-1 font-normal text-muted-foreground">
                        · {exam.subjectName}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex-shrink-0 text-muted-foreground">
                    {exam.daysUntil} {exam.daysUntil === 1 ? "day" : "days"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-4 text-center">
          <p className="text-[13px] font-bold">No exams on the calendar</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Add a date so we can count down and nudge your study plan.
          </p>
        </div>
      )}

      <ExamManageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        exams={exams}
        subjects={subjects}
      />
    </section>
  );
}

function formatExamDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
