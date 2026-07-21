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
import { EditableChatTitle } from "./editable-chat-title";
import { SaveAsNoteButton } from "./save-as-note-button";
import { SaveChatAsNoteButton } from "./save-chat-as-note-button";
import type { ChatAttachment, ChatConversationWithMessages, ChatMessage } from "../types";

/**
 * Max attachments per message. Matches the Zod schema cap in
 * `schemas/chat.ts` — bumping one requires bumping the other.
 */
const MAX_ATTACHMENTS = 4;

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

  // Up to `MAX_ATTACHMENTS` pending files per outgoing message. Each entry
  // holds the picked File + a local blob URL for preview until upload.
  const [attachments, setAttachments] = useState<
    { file: File; previewUrl: string }[]
  >([]);
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

  // Revoke every blob URL that ever passed through state on unmount so we
  // don't leak. We deliberately don't do this in a per-attachment cleanup
  // effect — removing one attachment shouldn't revoke a URL another entry
  // still holds.
  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast.error(`Max ${MAX_ATTACHMENTS} attachments per message.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const accepted: { file: File; previewUrl: string }[] = [];
    let rejectedTooLarge = 0;
    for (const file of picked.slice(0, room)) {
      if (file.size > 25 * 1024 * 1024) {
        rejectedTooLarge += 1;
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (rejectedTooLarge > 0) {
      toast.error(
        `Skipped ${rejectedTooLarge} file${rejectedTooLarge === 1 ? "" : "s"} over 25 MB.`,
      );
    }
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
    if (picked.length > room) {
      toast.error(`Only ${room} more attachment${room === 1 ? "" : "s"} allowed.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onRemoveAttachment(previewUrl: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.previewUrl !== previewUrl);
    });
  }

  function onClearAllAttachments() {
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
  }

  async function uploadAttachments(): Promise<ChatAttachment[] | null> {
    if (attachments.length === 0) return [];
    setUploading(true);
    try {
      const uploaded: ChatAttachment[] = [];
      for (const item of attachments) {
        const mimeType = item.file.type;
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
          body: item.file,
        });
        if (!putRes.ok) {
          toast.error("Upload failed. Try again.");
          return null;
        }
        uploaded.push({ path: begin.data.path, mimeType });
      }
      return uploaded;
    } finally {
      setUploading(false);
    }
  }

  async function onSend() {
    if (status === "streaming" || uploading) return;
    if (voice.listening) voice.stop();
    const trimmed = inputValue.trim();
    const hasAttachments = attachments.length > 0;
    if (trimmed.length === 0 && !hasAttachments) return;

    let uploadedAttachments: ChatAttachment[] | undefined;
    if (hasAttachments) {
      const uploaded = await uploadAttachments();
      if (!uploaded) return;
      uploadedAttachments = uploaded;
      onClearAllAttachments();
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
          <EditableChatTitle
            conversationId={conversation.id}
            title={conversation.title}
            subjectName={conversation.subjectName}
          />
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
        {attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.previewUrl}
                className="relative flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-1.5"
              >
                {a.file.type.startsWith("image/") ? (
                  // Local preview only — never persisted to the DOM after send.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.previewUrl}
                    alt="Attachment preview"
                    className="h-14 w-14 rounded-md object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent"
                  >
                    <FileText className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                )}
                <span
                  className="block w-14 truncate text-center text-[10.5px] font-semibold"
                  title={a.file.name}
                >
                  {a.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(a.previewUrl)}
                  aria-label={`Remove ${a.file.name}`}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            multiple
            className="sr-only"
            onChange={onPickImage}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Attach image or PDF (${attachments.length}/${MAX_ATTACHMENTS})`}
            onClick={() => fileInputRef.current?.click()}
            disabled={
              status === "streaming" ||
              uploading ||
              attachments.length >= MAX_ATTACHMENTS
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
                : attachments.length > 0
                  ? "Add a question about these files (optional)…"
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
              (inputValue.trim().length === 0 && attachments.length === 0)
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
