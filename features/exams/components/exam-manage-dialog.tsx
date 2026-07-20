"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Subject } from "@/features/academic-identity/types";

import { createExam } from "../actions/create-exam";
import { deleteExam } from "../actions/delete-exam";
import type { Exam } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exams: Exam[];
  subjects: Subject[];
}

/**
 * Manage-exams dialog: add form on top, list of existing exams below.
 * No separate settings page — students don't need a full CRUD screen for
 * something with a typical 5-15 entries per year.
 */
export function ExamManageDialog({ open, onOpenChange, exams, subjects }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isCreating, startCreate] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function reset() {
    setName("");
    setExamDate("");
    setSubjectId("");
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length === 0 || !examDate) {
      toast.error("Fill in both the name and the date.");
      return;
    }
    startCreate(async () => {
      const result = await createExam({
        name,
        examDate,
        subjectId: subjectId || undefined,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Exam added");
      reset();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startDelete(async () => {
      const result = await deleteExam(id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Exam removed");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage exams</DialogTitle>
          <DialogDescription>
            Add upcoming exam dates. We&apos;ll count down and highlight the closest one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onCreate} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exam-name">Exam name</Label>
            <Input
              id="exam-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Board English Paper 1"
              maxLength={120}
              disabled={isCreating}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exam-date">Date</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                disabled={isCreating}
              />
            </div>
            {subjects.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="exam-subject">Subject (optional)</Label>
                <select
                  id="exam-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={isCreating}
                  className="h-10 rounded-md border border-border bg-card px-3 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">None</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <Button
            type="submit"
            size="sm"
            loading={isCreating}
            disabled={name.trim().length === 0 || !examDate}
            className="w-fit gap-1.5"
          >
            <Plus className="h-3 w-3" strokeWidth={2.4} aria-hidden />
            Add exam
          </Button>
        </form>

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
            {exams.length === 0 ? "No exams yet" : `${exams.length} upcoming`}
          </div>
          {exams.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {exams.map((exam) => (
                <li
                  key={exam.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold">{exam.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {exam.examDate}
                      {exam.subjectName ? ` · ${exam.subjectName}` : ""}
                      {" · "}
                      {exam.daysUntil > 0
                        ? `${exam.daysUntil} ${exam.daysUntil === 1 ? "day" : "days"} away`
                        : exam.daysUntil === 0
                          ? "today"
                          : "past"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(exam.id)}
                    disabled={isDeleting}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                    aria-label={`Delete ${exam.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
