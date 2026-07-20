"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, Copy, Languages, ListChecks, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { runNoteAiAction } from "../actions/ai-note-action";
import type { NoteAiAction } from "@/lib/gemini/prompts/note-ai";

interface Props {
  noteId: string;
}

const OPTIONS: {
  key: NoteAiAction;
  label: string;
  hint: string;
  icon: typeof Sparkles;
}[] = [
  {
    key: "summarize",
    label: "Summarize",
    hint: "5–8 tight bullets",
    icon: Sparkles,
  },
  {
    key: "explain-simpler",
    label: "Explain simpler",
    hint: "Same content, easy words",
    icon: Languages,
  },
  {
    key: "key-points",
    label: "Extract key points",
    hint: "Facts, formulas, dates",
    icon: ListChecks,
  },
];

/**
 * Three-button popover on the note detail: Summarize / Explain Simpler /
 * Key Points. Clicking one calls Gemini and shows the response in a modal.
 *
 * Nothing is persisted; the student can copy the result. Saving as a new
 * note lands in a future iteration.
 */
export function AiActionsMenu({ noteId }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<NoteAiAction | null>(null);
  const [result, setResult] = useState<{ label: string; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function trigger(action: NoteAiAction, label: string) {
    setBusy(action);
    setOpen(true);
    setResult(null);
    setCopied(false);
    startTransition(async () => {
      const res = await runNoteAiAction({ noteId, action });
      setBusy(null);
      if (!res.ok) {
        setOpen(false);
        toast.error(res.error.message);
        return;
      }
      setResult({ label, text: res.data.text });
    });
  }

  async function onCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => trigger(opt.key, opt.label)}
            disabled={busy !== null}
            loading={busy === opt.key}
            aria-label={`${opt.label}: ${opt.hint}`}
          >
            <opt.icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {opt.label}
          </Button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" aria-hidden />
              {result?.label ?? "AI is thinking…"}
            </DialogTitle>
            <DialogDescription>
              AI can be wrong — double-check important facts.
            </DialogDescription>
          </DialogHeader>

          {result === null ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Sparkles className="mr-2 h-4 w-4 animate-pulse text-primary" aria-hidden />
              Generating…
            </div>
          ) : (
            <>
              <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border bg-card p-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed">
                  {result.text}
                </pre>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={onCopy} className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
