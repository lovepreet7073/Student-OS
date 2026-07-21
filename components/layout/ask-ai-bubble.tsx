"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { createConversation } from "@/features/chat/actions/create-conversation";
import { cn } from "@/lib/utils";

/**
 * Global "Ask AI" bubble (Module 61) upgraded to open a slide-out
 * **Quick Chat drawer** (Module 65) instead of navigating away.
 *
 * The drawer keeps the student's current page context intact — they
 * can be reading a note, tap Ask AI, type a question, hit send, and
 * only THEN do we navigate them into `/app/chat/[id]` with the reply
 * auto-streaming (?auto=1). This is one tap fewer than the previous
 * "navigate to /new → fill form → submit" flow and preserves what
 * they were doing when the question popped into their head.
 *
 * The bubble is hidden on:
 *   - Chat routes themselves (`/app/chat*`) — redundant.
 *   - Immersive flashcard-review flows where the bubble would collide
 *     with the sticky rating buttons.
 *   - The Helper page (which has its own composer).
 */
export function AskAiBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isHidden =
    pathname.startsWith("/app/chat") ||
    pathname.startsWith("/app/flashcards/") &&
      (pathname.endsWith("/review") || pathname.endsWith("/inbox") || pathname.endsWith("/weak")) ||
    pathname.startsWith("/app/help");

  if (isHidden) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 2) {
      toast.error("Type at least a couple of words.");
      return;
    }
    setSubmitting(true);
    const res = await createConversation({ firstMessage: text });
    if (!res.ok) {
      setSubmitting(false);
      toast.error(res.error.message);
      return;
    }
    // Reset + close BEFORE navigating so the drawer animates out cleanly.
    setMessage("");
    setOpen(false);
    router.push(`/app/chat/${res.data.id}?auto=1`);
    setSubmitting(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI a question"
        className="fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-extrabold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-6"
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        <span>Ask AI</span>
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "fixed z-50 flex flex-col gap-3 border border-border bg-card shadow-2xl",
              // Bottom sheet on mobile, right-side sheet on desktop.
              "inset-x-0 bottom-0 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
              "sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:h-svh sm:w-[420px] sm:rounded-none sm:border-l sm:border-t-0 sm:p-6",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              "sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <DialogPrimitive.Title className="text-[15px] font-extrabold tracking-tight">
                    Ask AI
                  </DialogPrimitive.Title>
                  <p className="text-[11.5px] text-muted-foreground">
                    Your syllabus tutor. Sends to a new chat.
                  </p>
                </div>
              </div>
              <DialogPrimitive.Close
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <Textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="e.g. Explain photosynthesis. Or: solve x² + 5x + 6 = 0."
                rows={5}
                enterKeyHint="send"
                autoCapitalize="sentences"
                className="min-h-[128px] resize-none"
                disabled={submitting}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Enter to send · Shift+Enter for a new line
                </span>
                <button
                  type="submit"
                  disabled={submitting || message.trim().length < 2}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-extrabold text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {submitting ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
