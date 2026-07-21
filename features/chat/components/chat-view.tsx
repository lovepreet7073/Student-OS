"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  ImagePlus,
  Mic,
  MicOff,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User2,
  X,
} from "lucide-react";
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

import type { Subject } from "@/features/academic-identity/types";

import { beginAttachmentUpload } from "../actions/begin-attachment-upload";
import { deleteConversation } from "../actions/delete-conversation";
import { editMessage } from "../actions/edit-message";
import { prepareRegenerate } from "../actions/prepare-regenerate";
import { useVoiceInput } from "../hooks/use-voice-input";
import { AttachmentThumb } from "./attachment-thumb";
import { SaveAsNoteButton } from "./save-as-note-button";
import { SaveChatAsNoteButton } from "./save-chat-as-note-button";
import type { ChatAttachment, ChatConversationWithMessages, ChatMessage } from "../types";

interface Props {
  conversation: ChatConversationWithMessages;
  subjects: Subject[];
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
export function ChatView({ conversation, subjects }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoStart = searchParams.get("auto") === "1";

  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [pending, setPending] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [inputValue, setInputValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // One attachment per outgoing message (v1). `pending` holds the picked
  // file + a local preview URL until it's either uploaded or discarded.
  const [attachment, setAttachment] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voice = useVoiceInput();
  const voiceBaselineRef = useRef("");

  // While listening, append the recognised final transcript to the current
  // input value. `voiceBaselineRef` remembers what was in the textarea BEFORE
  // the mic started so we don't wipe user-typed text.
  useEffect(() => {
    if (!voice.listening) return;
    const combined = [voiceBaselineRef.current, voice.finalTranscript]
      .filter((s) => s.trim().length > 0)
      .join(" ");
    setInputValue(combined);
  }, [voice.listening, voice.finalTranscript]);

  useEffect(() => {
    if (voice.error) toast.error(voice.error);
  }, [voice.error]);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    };
  }, [attachment]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending, scrollToBottom]);

  const streamAssistant = useCallback(
    async (
      message: string,
      opts: { attachments?: ChatAttachment[]; mode?: "send" | "regenerate" } = {},
    ) => {
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
            attachments: opts.attachments,
            mode: opts.mode ?? "send",
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
    void streamAssistant(first.content, { mode: "regenerate" });
  }, [shouldAutoStart, messages, streamAssistant]);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File is larger than 25 MB.");
      return;
    }
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment({ file, previewUrl: URL.createObjectURL(file) });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onClearAttachment() {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  }

  async function uploadAttachment(): Promise<ChatAttachment | null> {
    if (!attachment) return null;
    setUploading(true);
    try {
      const mimeType = attachment.file.type;
      const begin = await beginAttachmentUpload({
        conversationId: conversation.id,
        mimeType,
      });
      if (!begin.ok) {
        toast.error(begin.error.message);
        return null;
      }
      const putRes = await fetch(begin.data.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "x-upsert": "false",
        },
        body: attachment.file,
      });
      if (!putRes.ok) {
        toast.error("Upload failed. Try again.");
        return null;
      }
      return { path: begin.data.path, mimeType };
    } finally {
      setUploading(false);
    }
  }

  async function onSend() {
    if (status === "streaming" || uploading) return;
    if (voice.listening) voice.stop();
    const trimmed = inputValue.trim();
    const hasAttachment = attachment !== null;
    if (trimmed.length === 0 && !hasAttachment) return;

    let uploadedAttachments: ChatAttachment[] | undefined;
    if (hasAttachment) {
      const uploaded = await uploadAttachment();
      if (!uploaded) return;
      uploadedAttachments = [uploaded];
      onClearAttachment();
    }

    setInputValue("");
    // Optimistic append of the user's message.
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        conversationId: conversation.id,
        role: "user",
        content: trimmed,
        attachments: uploadedAttachments ?? [],
        createdAt: new Date().toISOString(),
      },
    ]);
    await streamAssistant(trimmed, { attachments: uploadedAttachments });
  }

  async function onRegenerate() {
    if (status === "streaming") return;
    // Drop the trailing assistant reply (both from DB via
    // prepareRegenerate and from local state) so the pending bubble
    // replaces it cleanly.
    const res = await prepareRegenerate({ conversationId: conversation.id });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setMessages((prev) => {
      const last = prev.at(-1);
      if (last && last.role === "assistant") return prev.slice(0, -1);
      return prev;
    });
    await streamAssistant(res.data.userContent, { mode: "regenerate" });
  }

  async function onSaveEdit(messageId: string, newContent: string) {
    const trimmed = newContent.trim();
    if (trimmed.length === 0) {
      toast.error("Edit can't be empty.");
      return false;
    }
    const res = await editMessage({ messageId, content: trimmed });
    if (!res.ok) {
      toast.error(res.error.message);
      return false;
    }
    // Truncate local state to match the DB truncate + swap in the new text.
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === messageId);
      if (idx < 0) return prev;
      const before = prev.slice(0, idx);
      const edited = { ...prev[idx]!, content: trimmed };
      return [...before, edited];
    });
    await streamAssistant(trimmed, { mode: "regenerate" });
    return true;
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
        <div className="flex items-center gap-1">
          {subjects.length > 0 && messages.length > 0 ? (
            <SaveChatAsNoteButton
              conversationId={conversation.id}
              subjects={subjects}
              defaultSubjectId={conversation.subjectId}
            />
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete chat"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Button>
        </div>
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
        {messages.map((m, idx) => {
          const isLastAssistant =
            m.role === "assistant" &&
            idx === messages.length - 1 &&
            status === "idle";
          return (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              attachments={m.attachments}
              messageId={m.id.startsWith("local-") ? undefined : m.id}
              subjects={subjects}
              defaultSubjectId={conversation.subjectId}
              onEdit={
                m.role === "user" && !m.id.startsWith("local-")
                  ? (next) => onSaveEdit(m.id, next)
                  : undefined
              }
              onRegenerate={isLastAssistant ? onRegenerate : undefined}
              disableActions={status === "streaming" || uploading}
            />
          );
        })}
        {status === "streaming" ? (
          <MessageBubble
            role="assistant"
            content={pending.length > 0 ? pending : "…"}
            pending
          />
        ) : null}
      </div>

      <div className="mt-3 pb-[env(safe-area-inset-bottom)]">
        {voice.listening ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-[12.5px] text-primary"
          >
            <Mic className="h-3.5 w-3.5 animate-pulse" aria-hidden />
            <span className="flex-1 truncate">
              {voice.interimTranscript.length > 0
                ? voice.interimTranscript
                : "Listening… speak now."}
            </span>
          </div>
        ) : null}
        {attachment ? (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-border bg-card p-2">
            {attachment.file.type.startsWith("image/") ? (
              // Local preview only — never persisted to the DOM after send.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.previewUrl}
                alt="Attachment preview"
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent"
              >
                <FileText className="h-6 w-6" strokeWidth={1.8} />
              </span>
            )}
            <div className="flex flex-1 flex-col gap-0.5 text-[12px]">
              <span className="truncate font-bold">{attachment.file.name}</span>
              <span className="text-muted-foreground">
                {(attachment.file.size / 1024).toFixed(0)} KB · will be sent to AI
              </span>
            </div>
            <button
              type="button"
              onClick={onClearAttachment}
              aria-label="Remove attachment"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="sr-only"
            onChange={onPickImage}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Attach image or PDF"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              status === "streaming" || uploading || attachment !== null
            }
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
          </Button>
          {voice.supported ? (
            <Button
              type="button"
              variant={voice.listening ? "primary" : "outline"}
              size="icon"
              aria-label={voice.listening ? "Stop dictating" : "Dictate a message"}
              aria-pressed={voice.listening}
              onClick={() => {
                if (voice.listening) {
                  voice.stop();
                } else {
                  voiceBaselineRef.current = inputValue;
                  voice.reset();
                  voice.start();
                }
              }}
              disabled={status === "streaming" || uploading}
              className={voice.listening ? "animate-pulse" : undefined}
            >
              {voice.listening ? (
                <MicOff className="h-4 w-4" aria-hidden />
              ) : (
                <Mic className="h-4 w-4" aria-hidden />
              )}
            </Button>
          ) : null}
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              status === "streaming"
                ? "Waiting for AI…"
                : attachment
                  ? "Add a question about this image (optional)…"
                  : "Ask anything. Shift+Enter for a new line."
            }
            rows={2}
            enterKeyHint="send"
            className="min-h-[52px] resize-none"
            disabled={status === "streaming" || uploading}
          />
          <Button
            type="button"
            size="lg"
            onClick={onSend}
            loading={uploading}
            disabled={
              status === "streaming" ||
              uploading ||
              (inputValue.trim().length === 0 && attachment === null)
            }
            aria-label="Send message"
          >
            {!uploading ? <Send className="h-4 w-4" aria-hidden /> : null}
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
  attachments,
  pending,
  messageId,
  subjects,
  defaultSubjectId,
  onEdit,
  onRegenerate,
  disableActions,
}: {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  pending?: boolean;
  messageId?: string;
  subjects?: Subject[];
  defaultSubjectId?: string | null;
  /** Called with the new text. Returns true if the edit succeeded. */
  onEdit?: (nextContent: string) => Promise<boolean>;
  /** Rendered as a "Regenerate" button on the last assistant reply. */
  onRegenerate?: () => Promise<void> | void;
  disableActions?: boolean;
}) {
  const isUser = role === "user";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(content);
  }, [content, editing]);

  const canSave =
    !isUser &&
    !pending &&
    messageId &&
    subjects &&
    subjects.length > 0 &&
    content.trim().length > 0;
  const canEdit = !!onEdit && !pending && !editing;
  const canRegenerate = !!onRegenerate && !pending && !disableActions;
  const hasContent = content.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;

  async function submitEdit() {
    if (!onEdit) return;
    setSavingEdit(true);
    const ok = await onEdit(draft);
    setSavingEdit(false);
    if (ok) setEditing(false);
  }

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
      <div className="flex max-w-[75%] flex-col gap-1">
        {hasAttachments ? (
          <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
            {attachments.map((a) => (
              <AttachmentThumb key={a.path} attachment={a} />
            ))}
          </div>
        ) : null}
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="min-h-[72px] resize-none text-[14px]"
              disabled={savingEdit}
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(content);
                }}
                disabled={savingEdit}
                className="rounded-md px-2 py-1 text-[12px] font-bold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={savingEdit || draft.trim().length === 0}
                className="rounded-md bg-primary px-2 py-1 text-[12px] font-bold text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {savingEdit ? "Saving…" : "Save & regenerate"}
              </button>
            </div>
          </div>
        ) : hasContent || pending ? (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
              isUser
                ? "rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm bg-secondary text-foreground",
              pending && "animate-pulse",
            )}
          >
            <p className="whitespace-pre-wrap break-words">{content}</p>
          </div>
        ) : null}
        {!editing ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              isUser ? "justify-end" : "justify-start",
            )}
          >
            {canEdit ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={disableActions}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                Edit
              </button>
            ) : null}
            {canRegenerate ? (
              <button
                type="button"
                onClick={() => void onRegenerate!()}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw className="h-3 w-3" aria-hidden />
                Regenerate
              </button>
            ) : null}
            {canSave ? (
              <SaveAsNoteButton
                messageId={messageId!}
                subjects={subjects!}
                defaultSubjectId={defaultSubjectId ?? null}
              />
            ) : null}
          </div>
        ) : null}
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
