"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Subject } from "@/features/academic-identity/types";

import { createConversation } from "../actions/create-conversation";

interface Props {
  subjects: Subject[];
}

export function NewChatForm({ subjects }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) {
      toast.error("Type something to start.");
      return;
    }
    setSubmitting(true);
    const res = await createConversation({
      firstMessage: message,
      subjectId: subjectId || undefined,
    });
    if (!res.ok) {
      setSubmitting(false);
      toast.error(res.error.message);
      return;
    }
    router.push(`/app/chat/${res.data.id}?auto=1`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="chat-subject">
          Subject <span className="text-muted-foreground">(optional)</span>
        </Label>
        <select
          id="chat-subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="flex h-11 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:text-sm"
        >
          <option value="">Any subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="chat-message">Your first message</Label>
        <Textarea
          id="chat-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Explain photosynthesis simply. Or: help me solve x² + 5x + 6 = 0."
          enterKeyHint="send"
          autoCapitalize="sentences"
          disabled={submitting}
        />
      </div>

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        <Send className="h-4 w-4" aria-hidden />
        Start chat
      </Button>
    </form>
  );
}
