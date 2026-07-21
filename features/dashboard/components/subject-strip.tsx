import Link from "next/link";

import type { Subject } from "@/features/academic-identity/types";

import { subjectTones } from "./subjects-grid";

interface Props {
  subjects: Subject[];
}

/**
 * Mobile-only horizontal chip strip of the student's active subjects
 * (Module 67). Sits high on Today so one tap reaches subject-scoped
 * Library from the top of the page — the mobile equivalent of the
 * desktop sidebar Shortcuts.
 *
 * Hides on `lg+` because the SubjectsGrid + desktop Shortcuts already
 * cover subject access on wider viewports. Also hides when the student
 * has zero subjects (brand-new onboarding state).
 *
 * Chips are colour-matched to the SubjectsGrid via the shared
 * `subjectTones` palette so a subject's colour is consistent between
 * the strip, the grid card, and any future subject badges.
 */
export function SubjectStrip({ subjects }: Props) {
  if (subjects.length === 0) return null;

  return (
    <nav
      aria-label="Jump to subject"
      className="-mx-5 overflow-x-auto px-5 lg:hidden"
    >
      <ul className="flex gap-2 pb-1">
        {subjects.map((subject, i) => {
          const tone = subjectTones[i % subjectTones.length]!;
          const initial = subject.name.trim()[0]?.toUpperCase() ?? "?";
          return (
            <li key={subject.id} className="flex-shrink-0">
              <Link
                href={`/app/notes?subject=${subject.id}`}
                className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold"
                  style={{ background: tone.tint, color: tone.color }}
                >
                  {initial}
                </span>
                <span className="text-[13px] font-bold tracking-tight">
                  {subject.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
