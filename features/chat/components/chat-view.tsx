"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles, Trash2, User2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { deleteConversation } from "../actions/delete-conversation";
import type { ChatConversationWithMessages, ChatMessage } from "../types";

interface Props {
  conversation: ChatConversationWithMessages;
}

/**
 * Multi-turn chat surface with streaming assistant responses.
 *
 * State machine:
 *   `idle` (input enabled) → `streaming` (assistant tokens arriving) → `idle`
 *
 * The streaming payload is plain text over `text/plain`. We read it via
 * `response.body.getReader()` and append chunks to the pending assistant
 * message. Persisted messages come from server props; the streamed
 * message becomes the last item in local state, and on next navigation
 * the server-rendered messages include it.
 *
 * `?auto=1` (set by <NewChatForm> after creating a conversation) auto-fires
 * the first assistant response so the student doesn't have to hit "Send"
 * on their own opening message.
 */
export function ChatView({ conversation }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoStart = searchParams.get("auto") === "1";

  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [pending, setPending] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [inputValue, setInputValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoTriggeredRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending, scrollToBottom]);

  const streamAssistant = useCallback(
    async (message: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("streaming");
      setPending("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversation.id,
            message,
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
        setPending("");
        // The server persisted the assistant reply during the stream's
        // `finally`. Refresh so the next render pulls it as a real row.
        router.refresh();
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        toast.error(
          e instanceof Error ? e.message : "The AI stopped responding.",
        );
        setPending("");
      } finally {
        setStatus("idle");
      }
    },
    [conversation.id, router],
  );

  // Auto-fire the first assistant reply when the URL carries `?auto=1`.
  useEffect(() => {
    if (!shouldAutoStart) return;
    if (autoTriggeredRef.current) return;
    if (messages.length !== 1 || messages[0]?.role !== "user") return;
    autoTriggeredRef.current = true;
    const first = messages[0];
    void streamAssistant(first.content);
  }, [shouldAutoStart, messages, streamAssistant]);

  async function onSend() {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0 || status === "streaming") return;
    setInputValue("");
    // Optimistic append of the user's message.
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        conversationId: conversation.id,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    await streamAssistant(trimmed);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  async function onDelete() {
    setDeleting(true);
    const res = await deleteConversation({ conversationId: conversation.id });
    setDeleting(false);
    setConfirmDelete(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Chat deleted");
    router.push("/app/chat");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[780px] flex-col px-5 pb-4 pt-4 sm:px-7 lg:px-11">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" aria-label="Back">
            <Link href="/app/chat">
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            </Link>
          </Button>
          <div className="flex min-w-0 flex-col">
            <div className="truncate text-[15px] font-extrabold tracking-tight">
              {conversation.title}
            </div>
            {conversation.subjectName ? (
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {conversation.subjectName}
              </div>
            ) : null}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete chat"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-4"
      >
        {messages.length === 0 && pending.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground">
            Say hello to start the conversation.
          </p>
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
                ? "Waiting for AI…"
                : "Ask anything. Shift+Enter for a new line."
            }
            rows={2}
            enterKeyHint="send"
            className="min-h-[52px] resize-none"
            disabled={status === "streaming"}
          />
          <Button
            type="button"
            size="lg"
            onClick={onSend}
            disabled={
              status === "streaming" || inputValue.trim().length === 0
            }
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              The conversation and every message will be permanently removed.
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
