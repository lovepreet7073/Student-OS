"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Subject } from "@/features/academic-identity/types";

import { askDoubt } from "../actions/ask-doubt";

interface Props {
  subjects: Subject[];
}

export function DoubtForm({ subjects }: Props) {
  const [question, setQuestion] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [isPending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 3) {
      toast.error("Ask a real question (at least 3 characters).");
      return;
    }
    start(async () => {
      const result = await askDoubt({
        question,
        subjectId: subjectId || undefined,
      });
      if (result && !result.ok) {
        toast.error(result.error.message);
      }
      // On success the action redirects, so we don't reach here.
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="question">Your question</Label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Explain photosynthesis light reaction step by step, or solve: if x² + 5x + 6 = 0…"
          maxLength={4000}
          rows={5}
          disabled={isPending}
          enterKeyHint="send"
          className="min-h-[120px] resize-y rounded-md border border-border bg-card p-3 text-[15px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <div className="text-right text-[11px] font-semibold text-muted-foreground">
          {question.length} / 4000
        </div>
      </div>

      {subjects.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">Subject (optional)</Label>
          <select
            id="subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={isPending}
            className="h-11 rounded-md border border-border bg-card px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All / any subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-[11.5px] text-muted-foreground">
            Adding a subject tunes the answer's vocabulary and depth.
          </p>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isPending}
        disabled={question.trim().length < 3}
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        {isPending ? "AI is thinking…" : "Ask AI"}
      </Button>

      <p className="text-center text-[11.5px] text-muted-foreground">
        The AI can be wrong. Double-check important answers.
      </p>
    </form>
  );
}
