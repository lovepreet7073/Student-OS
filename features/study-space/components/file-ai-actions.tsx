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

import { runFileAiAction } from "../actions/ai-file-action";
import type { FileAiAction } from "@/lib/gemini/prompts/file-ai";

interface Props {
  fileId: string;
  disabled?: boolean;
}

const OPTIONS: {
  key: FileAiAction;
  label: string;
  hint: string;
  icon: typeof Sparkles;
}[] = [
  { key: "summarize",       label: "Summarize",       hint: "6–10 tight bullets",             icon: Sparkles },
  { key: "key-points",      label: "Key points",      hint: "Facts, formulas, dates",         icon: ListChecks },
  { key: "explain-simpler", label: "Explain simpler", hint: "Same content, easy words",       icon: Languages },
];

/**
 * Three AI actions on the file detail page. Same UX as the notes AiActionsMenu:
 * click → modal opens with a loading spinner → replaced by markdown result
 * with a Copy button. Nothing persists — the student copies what they want.
 */
export function FileAiActions({ fileId, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<FileAiAction | null>(null);
  const [result, setResult] = useState<{ label: string; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function trigger(action: FileAiAction, label: string) {
    setBusy(action);
    setOpen(true);
    setResult(null);
    setCopied(false);
    startTransition(async () => {
      const res = await runFileAiAction({ fileId, action });
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
            disabled={disabled || busy !== null}
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
              {result?.label ?? "AI is reading your document…"}
            </DialogTitle>
            <DialogDescription>
              AI can be wrong — double-check important facts.
            </DialogDescription>
          </DialogHeader>

          {result === null ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Sparkles className="mr-2 h-4 w-4 animate-pulse text-primary" aria-hidden />
              Reading the whole document. This can take 15-45 seconds.
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
