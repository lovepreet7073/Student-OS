"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle, Send, Sparkles, User2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface HelpMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS: string[] = [
  "How do I create a flashcard deck?",
  "What's the difference between Quiz and Flashcards?",
  "How do I share a note with my class?",
  "How do I attach a photo to the AI chat?",
  "Where do I upload my study PDFs?",
  "How does the streak work?",
];

/**
 * Transient in-app help chat. Messages live in `useState` only — a
 * session ends when the student navigates away. History is re-sent
 * with every turn (capped in the API route at 20 prior messages) so
 * follow-up questions still get context.
 */
export function HelpView() {
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [pending, setPending] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending, scrollToBottom]);

  const streamAssistant = useCallback(
    async (userMessage: string, historyForSend: HelpMessage[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("streaming");
      setPending("");

      try {
        const res = await fetch("/api/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            history: historyForSend.map((m) => ({
              role: m.role,
              content: m.content,
            })),
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
          setPending(acc);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: acc,
          },
        ]);
        setPending("");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        toast.error(
          e instanceof Error ? e.message : "The helper stopped responding.",
        );
        setPending("");
      } finally {
        setStatus("idle");
      }
    },
    [],
  );

  async function send(text: string) {
    const trimmed = text.trim();
    if (trimmed.length === 0 || status === "streaming") return;
    const nextMessages: HelpMessage[] = [
      ...messages,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInputValue("");
    await streamAssistant(trimmed, messages);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(inputValue);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[780px] flex-col px-5 pb-4 pt-4 sm:px-7 lg:px-11">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-primary">
            <HelpCircle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[24px]">
              StudyOS Helper
            </h1>
            <p className="text-[12.5px] text-muted-foreground">
              How to use the app. For subject help, open{" "}
              <Link
                href="/app/chat"
                className="font-bold text-primary underline underline-offset-2"
              >
                AI Study Chat
              </Link>
              .
            </p>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-4"
      >
        {messages.length === 0 && pending.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-[13px] text-muted-foreground">
              Ask anything about StudyOS — features, shortcuts, or where
              something lives.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  disabled={status === "streaming"}
                  className={cn(
                    "rounded-md border border-border bg-background p-3 text-left text-[13px] transition-colors",
                    "hover:border-primary/40 hover:text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {status === "streaming" ? (
          <MessageBubble
            role="assistant"
            content={pending.length > 0 ? pending : "…"}
            pending
          />
        ) : null}
      </div>

      <div className="mt-3 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-end gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              status === "streaming"
                ? "Waiting for helper…"
                : "Ask about StudyOS. Shift+Enter for a new line."
            }
            rows={2}
            enterKeyHint="send"
            className="min-h-[52px] resize-none"
            disabled={status === "streaming"}
          />
          <Button
            type="button"
            size="lg"
            onClick={() => void send(inputValue)}
            disabled={status === "streaming" || inputValue.trim().length === 0}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  pending,
}: {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-primary"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary text-foreground",
          pending && "animate-pulse",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
      {isUser ? (
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <User2 className="h-4 w-4" strokeWidth={2} />
        </span>
      ) : null}
    </div>
  );
}
