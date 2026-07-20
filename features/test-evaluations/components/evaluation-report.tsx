"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-date";

import { deleteEvaluation } from "../actions/delete-evaluation";
import { examTypeLabel } from "../lib/grading";
import type { TestEvaluationWithPages } from "../types";
import { EvaluationAnswerCard } from "./evaluation-answer-card";
import { EvaluationScoreVisual } from "./evaluation-score-visual";
import { EvaluationStatusCard } from "./evaluation-status-card";
import { WeakTopicsPanel } from "./weak-topics-panel";

interface EvaluationReportProps {
  evaluation: TestEvaluationWithPages;
}

export function EvaluationReport({ evaluation }: EvaluationReportProps) {
  const [deleting, startDelete] = useTransition();

  const handleDelete = () => {
    startDelete(async () => {
      const result = await deleteEvaluation({ id: evaluation.id }, { redirectTo: "/app/tests" });
      if (result && !result.ok) toast.error(result.error.message);
    });
  };

  const isComplete = evaluation.status === "completed";

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to tests" className="mb-5 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/tests">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {evaluation.subjectName} · {examTypeLabel(evaluation.examType)}
            {evaluation.evaluatedAt ? ` · ${formatRelativeTime(evaluation.evaluatedAt)}` : ""}
          </div>
          <h1 className="truncate text-[20px] font-extrabold tracking-tight sm:text-[24px]">
            {evaluation.title}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete evaluation"
        >
          <Trash2 className="h-[18px] w-[18px] text-danger" aria-hidden />
        </Button>
      </nav>

      {!isComplete ? (
        <EvaluationStatusCard
          evaluationId={evaluation.id}
          status={evaluation.status}
          errorMessage={evaluation.errorMessage}
        />
      ) : (
        <>
          <div className="mb-5">
            <EvaluationScoreVisual
              score={evaluation.aiScore ?? 0}
              maxMarks={evaluation.maxMarks}
              percentage={evaluation.aiPercentage ?? 0}
              grade={evaluation.aiGrade ?? "F"}
            />
          </div>

          {evaluation.aiSummary ? (
            <p className="mb-6 rounded-md bg-secondary p-4 text-pretty text-[14px] leading-relaxed text-foreground">
              {evaluation.aiSummary}
            </p>
          ) : null}

          <div className="mb-6 flex flex-col gap-3">
            {(evaluation.answers ?? []).map((answer) => (
              <EvaluationAnswerCard key={answer.question_number} answer={answer} />
            ))}
          </div>

          {evaluation.recommendedTopics && evaluation.recommendedTopics.length > 0 ? (
            <WeakTopicsPanel
              topics={evaluation.recommendedTopics}
              subjectId={evaluation.subjectId}
              subjectName={evaluation.subjectName}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
