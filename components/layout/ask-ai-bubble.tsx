"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { createConversation } from "@/features/chat/actions/create-conversation";
import { cn } from "@/lib/utils";

/**
 * Global "Ask AI" bubble (Module 61 → 65 → 69).
 *
 * Module 65 introduced the slide-out drawer so a student doesn't lose
 * their current page context to ask a question. Module 69 finishes the
 * loop: the reply **streams inline in the drawer** instead of routing
 * away. A student can be reading a note, tap Ask AI, type a question,
 * watch the answer appear right there, and pick up their note again —
 * no page changes.
 *
 * State machine:
 *   idle       — composer visible (textarea + Send)
 *   creating   — createConversation is in flight
 *   streaming  — tokens arriving from /api/chat (mode: regenerate)
 *   done       — full reply visible + "Ask another" / "Full chat"
 *
 * The reply IS persisted to `chat_messages` because the API route
 * writes it in its `finally` block. So the drawer answer and the
 * "Full chat" view stay in sync automatically.
 *
 * Aborts the stream if the drawer closes mid-stream so we don't leak
 * fetches. Whatever text arrived before close is still persisted on
 * the server (same guarantee ChatView relies on).
 *
 * Hidden on:
 *   - Chat routes themselves (`/app/chat*`) — redundant.
 *   - Immersive flashcard-review flows where the bubble would collide
 *     with the sticky rating buttons.
 *   - The Helper page (which has its own composer).
 */

type Phase = "idle" | "creating" | "streaming" | "done";

export function AskAiBubble() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [reply, setReply] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isHidden =
    pathname.startsWith("/app/chat") ||
    pathname.startsWith("/app/flashcards/") &&
      (pathname.endsWith("/review") || pathname.endsWith("/inbox") || pathname.endsWith("/weak")) ||
    pathname.startsWith("/app/help");

  // Reset when the drawer opens so a repeat use is a clean slate.
  useEffect(() => {
    if (open) {
      setPhase("idle");
      setMessage("");
      setReply("");
      setError(null);
      setConversationId(null);
    }
  }, [open]);

  // Abort any in-flight stream on unmount OR when the drawer is closed.
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      abortRef.current = null;
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  if (isHidden) return null;

  async function streamReply(convoId: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("streaming");
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convoId,
          // regenerate mode: the user message already exists (we just
          // created it via createConversation). We don't want /api/chat
          // to double-insert.
          message: "",
          mode: "regenerate",
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReply(acc);
      }
      setPhase("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "The AI stopped responding.";
      setError(msg);
      setPhase("done");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (text.length < 2) {
      toast.error("Type at least a couple of words.");
      return;
    }
    setPhase("creating");
    setError(null);
    const res = await createConversation({ firstMessage: text });
    if (!res.ok) {
      setPhase("idle");
      toast.error(res.error.message);
      return;
    }
    setConversationId(res.data.id);
    await streamReply(res.data.id);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit(e as unknown as React.FormEvent);
    }
  }

  function askAnother() {
    abortRef.current?.abort();
    setPhase("idle");
    setMessage("");
    setReply("");
    setError(null);
    setConversationId(null);
  }

  function jumpToFullChat() {
    if (!conversationId) return;
    setOpen(false);
    router.push(`/app/chat/${conversationId}`);
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
              "fixed z-50 flex max-h-svh flex-col gap-3 border border-border bg-card shadow-2xl",
              // Bottom sheet on mobile, right-side sheet on desktop.
              "inset-x-0 bottom-0 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
              "sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:h-svh sm:w-[440px] sm:rounded-none sm:border-l sm:border-t-0 sm:p-6",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              "sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary",
                    phase === "streaming" && "animate-pulse",
                  )}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <DialogPrimitive.Title className="text-[15px] font-extrabold tracking-tight">
                    Ask AI
                  </DialogPrimitive.Title>
                  <p className="text-[11.5px] text-muted-foreground">
                    {phase === "streaming"
                      ? "Thinking…"
                      : phase === "done"
                        ? "Reply saved to your chats."
                        : "Your syllabus tutor. Reply streams here."}
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

            {phase === "idle" ? (
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
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Enter to send · Shift+Enter for a new line
                  </span>
                  <button
                    type="submit"
                    disabled={message.trim().length < 2}
                    className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-extrabold text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    Send
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                {/* Your question, small, at the top of the reply view. */}
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    You asked
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed">{message}</p>
                </div>

                {/* Streaming reply body. */}
                <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-3">
                  {phase === "creating" ? (
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <RefreshCw
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden
                      />
                      Starting a new chat…
                    </div>
                  ) : null}
                  {reply.length > 0 ? (
                    <p
                      className={cn(
                        "whitespace-pre-wrap break-words text-[13.5px] leading-relaxed",
                        phase === "streaming" && "animate-pulse",
                      )}
                    >
                      {reply}
                    </p>
                  ) : phase === "streaming" ? (
                    <p className="text-[13px] text-muted-foreground">
                      Thinking…
                    </p>
                  ) : null}
                  {error ? (
                    <p className="mt-2 rounded-md border border-danger/30 bg-danger/5 p-2 text-[12.5px] text-danger">
                      {error}
                    </p>
                  ) : null}
                </div>

                {phase === "done" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={askAnother}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-4 text-[13px] font-bold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Ask another
                    </button>
                    {conversationId ? (
                      <button
                        type="button"
                        onClick={jumpToFullChat}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-extrabold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Continue in full chat
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {phase === "done" && conversationId ? (
                  <Link
                    href={`/app/chat/${conversationId}`}
                    onClick={() => setOpen(false)}
                    className="hidden text-center text-[11.5px] text-muted-foreground underline underline-offset-2 hover:text-foreground sm:block"
                  >
                    Also saved as a chat at /app/chat
                  </Link>
                ) : null}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
