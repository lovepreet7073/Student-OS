"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Globe, Link2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { setNoteVisibility } from "../actions/set-note-visibility";

interface Props {
  noteId: string;
  initialShareToken: string | null;
  initialVisibility: "private" | "link";
}

/**
 * Two-state visibility toggle: private (default) and link-shared. When link
 * mode is on we show the tokenized URL with a copy button. Toggling off
 * preserves the token so re-enabling reuses the same URL.
 */
export function ShareNoteDialog({
  noteId,
  initialShareToken,
  initialVisibility,
}: Props) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "link">(initialVisibility);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [isPending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/s/n/${shareToken}`
      : null;

  function setMode(next: "private" | "link") {
    if (next === visibility) return;
    start(async () => {
      const result = await setNoteVisibility({ noteId, visibility: next });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setVisibility(next);
      if (next === "link" && result.data.shareToken) {
        setShareToken(result.data.shareToken);
      }
      toast.success(next === "link" ? "Link created" : "Sharing turned off");
    });
  }

  async function onCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Share">
          <Link2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this note</DialogTitle>
          <DialogDescription>
            Anyone with the link can read this note. They don&apos;t need a StudyOS account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("private")}
            aria-pressed={visibility === "private"}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              visibility === "private"
                ? "border-primary bg-accent"
                : "border-border bg-card hover:border-primary/40",
            )}
            disabled={isPending}
          >
            <Lock className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span className="text-[13px] font-extrabold">Private</span>
            <span className="text-[11.5px] text-muted-foreground">Only you can see it.</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            aria-pressed={visibility === "link"}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              visibility === "link"
                ? "border-primary bg-accent"
                : "border-border bg-card hover:border-primary/40",
            )}
            disabled={isPending}
          >
            <Globe className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span className="text-[13px] font-extrabold">Share via link</span>
            <span className="text-[11.5px] text-muted-foreground">Anyone with the link.</span>
          </button>
        </div>

        {visibility === "link" && shareUrl ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary p-2">
            <input
              readOnly
              value={shareUrl}
              className="min-w-0 flex-1 bg-transparent px-2 text-[12.5px] focus-visible:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <Button size="sm" variant="outline" onClick={onCopy} className="gap-1">
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} /> Copy
                </>
              )}
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
