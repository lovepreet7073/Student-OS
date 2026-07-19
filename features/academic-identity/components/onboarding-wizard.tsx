"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { saveMyProfile } from "../actions/save-my-profile";
import { getSubjects } from "../actions/get-subjects";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import type { Board, ClassLevel, Medium, Subject } from "../types";

import { BoardStep } from "./steps/board-step";
import { ClassStep } from "./steps/class-step";
import { DoneStep } from "./steps/done-step";
import { LanguageStep } from "./steps/language-step";
import { MediumStep } from "./steps/medium-step";
import { SubjectStep } from "./steps/subject-step";
import { SummaryStep, type SummaryRow } from "./steps/summary-step";
import { WizardFooter } from "./wizard-footer";
import { WizardProgress } from "./wizard-progress";
import { WizardRail } from "./wizard-rail";

const RAIL_LABELS = ["Board", "Medium", "Class", "Subjects", "Language", "Summary"];
const TOTAL_STEPS = 6;

// Slugs pre-selected by default when subjects load — matches design intent
// of "we've pre-selected the usual ones".
const DEFAULT_SUBJECT_SLUGS = new Set([
  "mathematics",
  "science",
  "english",
  "social-science",
  "social-studies",
]);

interface OnboardingWizardProps {
  boards: Board[];
  mediums: Medium[];
  classes: ClassLevel[];
}

interface WizardState {
  step: number;
  boardId: string | null;
  mediumId: string | null;
  classId: string | null;
  subjectIds: Set<string>;
  language: Locale;
}

export function OnboardingWizard({ boards, mediums, classes }: OnboardingWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    boardId: null,
    mediumId: null,
    classId: null,
    subjectIds: new Set(),
    language: DEFAULT_LOCALE,
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, startSubjectsTransition] = useTransition();
  const [saving, startSavingTransition] = useTransition();

  const { step, boardId, mediumId, classId, subjectIds, language } = state;

  // Refetch subjects whenever the (board, class, medium) triple settles.
  // Uses a cancellation flag so out-of-order responses can't overwrite newer state.
  useEffect(() => {
    if (!boardId || !classId || !mediumId) {
      setSubjects([]);
      return;
    }
    let cancelled = false;
    startSubjectsTransition(async () => {
      const result = await getSubjects({ boardId, classId, mediumId });
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error.message);
        setSubjects([]);
        return;
      }
      const nextSubjects = result.data;
      setSubjects(nextSubjects);

      // Reconcile the current selection against the new scope:
      //   - drop selected IDs that no longer exist in the new subject list
      //   - if that leaves nothing selected, re-apply defaults
      const validIds = new Set(nextSubjects.map((s) => s.id));
      setState((prev) => {
        const kept = new Set<string>();
        for (const id of prev.subjectIds) if (validIds.has(id)) kept.add(id);
        if (kept.size === 0) {
          nextSubjects
            .filter((s) => DEFAULT_SUBJECT_SLUGS.has(s.slug))
            .forEach((s) => kept.add(s.id));
        }
        return { ...prev, subjectIds: kept };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [boardId, classId, mediumId]);

  // -------- computed ----------------------------------------------------
  const selectedBoard = useMemo(() => boards.find((b) => b.id === boardId), [boards, boardId]);
  const selectedMedium = useMemo(() => mediums.find((m) => m.id === mediumId), [mediums, mediumId]);
  const selectedClass = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);

  const isValid: Record<number, boolean> = {
    1: !!boardId,
    2: !!mediumId,
    3: !!classId,
    4: subjectIds.size > 0,
    5: !!language,
    6: true,
  };
  const canContinue = isValid[step] ?? false;
  const isSummary = step === TOTAL_STEPS;
  const isDone = step === TOTAL_STEPS + 1;

  // -------- actions -----------------------------------------------------
  const goStep = (n: number) => setState((s) => ({ ...s, step: Math.max(1, Math.min(TOTAL_STEPS, n)) }));
  const goBack = () => setState((s) => ({ ...s, step: Math.max(1, s.step - 1) }));

  const handleContinue = () => {
    if (isSummary) {
      persist();
      return;
    }
    setState((s) => ({ ...s, step: Math.min(TOTAL_STEPS, s.step + 1) }));
  };

  const persist = () => {
    if (!boardId || !mediumId || !classId || subjectIds.size === 0) {
      toast.error("Please complete every step first.");
      return;
    }
    startSavingTransition(async () => {
      const result = await saveMyProfile({
        boardId,
        mediumId,
        classId,
        subjectIds: Array.from(subjectIds),
        preferredLanguage: language,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setState((s) => ({ ...s, step: TOTAL_STEPS + 1 }));
    });
  };

  // -------- rail --------------------------------------------------------
  const railSteps = RAIL_LABELS.map((label, i) => {
    const n = i + 1;
    return {
      n,
      label,
      done: step > n,
      active: step === n,
      onSelect: () => goStep(n),
    };
  });

  // -------- summary rows ------------------------------------------------
  const summaryRows: SummaryRow[] = [
    { label: "Board",     value: selectedBoard?.shortName ?? "—",                       editStep: 1 },
    { label: "Medium",    value: selectedMedium ? `${selectedMedium.name} Medium` : "—", editStep: 2 },
    { label: "Class",     value: selectedClass ? `Class ${selectedClass.name}` : "—",   editStep: 3 },
    {
      label: "Subjects",
      value:
        subjects
          .filter((s) => subjectIds.has(s.id))
          .map((s) => s.name)
          .join(", ") || "—",
      editStep: 4,
    },
    { label: "Interface language", value: languageDisplay(language), editStep: 5 },
  ];

  // -------- render ------------------------------------------------------
  return (
    <div
      className={cn(
        "grid min-h-svh bg-background",
        isDone ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[300px_1fr]",
      )}
    >
      {!isDone ? <WizardRail steps={railSteps} /> : null}

      <main className="flex h-svh flex-col lg:h-screen">
        {!isDone ? (
          <WizardProgress step={step} total={TOTAL_STEPS} onBack={goBack} canGoBack={step > 1} />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[640px] px-5 py-6 sm:px-10 sm:py-8">
            {step === 1 && (
              <BoardStep
                boards={boards}
                selectedId={boardId}
                onSelect={(id) => setState((s) => ({ ...s, boardId: id }))}
              />
            )}
            {step === 2 && (
              <MediumStep
                mediums={mediums}
                selectedId={mediumId}
                onSelect={(id) => setState((s) => ({ ...s, mediumId: id }))}
              />
            )}
            {step === 3 && (
              <ClassStep
                classes={classes}
                selectedId={classId}
                onSelect={(id) => setState((s) => ({ ...s, classId: id }))}
              />
            )}
            {step === 4 && (
              <SubjectStep
                subjects={subjects}
                selectedIds={subjectIds}
                loading={subjectsLoading}
                boardShortName={selectedBoard?.shortName ?? ""}
                className={selectedClass?.name ?? ""}
                boardId={boardId ?? ""}
                classId={classId ?? ""}
                mediumId={mediumId ?? ""}
                onToggle={(subjectId) =>
                  setState((s) => {
                    const next = new Set(s.subjectIds);
                    next.has(subjectId) ? next.delete(subjectId) : next.add(subjectId);
                    return { ...s, subjectIds: next };
                  })
                }
                onCustomAdded={(subject) => {
                  setSubjects((prev) => [...prev, subject]);
                  setState((s) => {
                    const next = new Set(s.subjectIds);
                    next.add(subject.id);
                    return { ...s, subjectIds: next };
                  });
                }}
              />
            )}
            {step === 5 && (
              <LanguageStep
                selectedCode={language}
                onSelect={(code) => setState((s) => ({ ...s, language: code }))}
                mediumLabel={selectedMedium?.name ?? "English"}
              />
            )}
            {step === 6 && <SummaryStep rows={summaryRows} onEdit={goStep} />}
            {isDone && (
              <DoneStep
                boardShortName={selectedBoard?.shortName ?? ""}
                mediumLabel={selectedMedium?.name ?? ""}
                className={selectedClass?.name ?? ""}
              />
            )}
          </div>
        </div>

        {!isDone ? (
          <WizardFooter
            label={isSummary ? "Finish setup" : "Continue"}
            onClick={handleContinue}
            disabled={!canContinue}
            loading={saving}
          />
        ) : null}
      </main>
    </div>
  );
}

function languageDisplay(code: Locale): string {
  const map: Record<Locale, string> = { en: "English", pa: "ਪੰਜਾਬੀ", hi: "हिन्दी" };
  return map[code];
}
