"use client";

import { useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { startChatFromNote } from "@/features/chat/actions/start-chat-from-note";

interface Props {
  noteId: string;
}

/**
 * Deep-links a note into a new AI chat. The server action inserts the
 * conversation + seeded opening message and then `redirect()`s to
 * `/app/chat/{id}?auto=1`, so the assistant auto-answers on arrival.
 *
 * If we get here through the redirect, the action never returns — the
 * only way this component sees a Result is on failure.
 */
export function AskAiButton({ noteId }: Props) {
  const [isPending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await startChatFromNote(noteId);
      // A successful action calls redirect() and never returns; only
      // failures reach this branch.
      if (res && !res.ok) toast.error(res.error.message);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-1.5"
      onClick={onClick}
      loading={isPending}
      aria-label="Discuss this note with AI"
    >
      <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Ask AI about this
    </Button>
  );
}
