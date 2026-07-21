"use client";

import Link from "next/link";
import { useState } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Subject } from "@/features/academic-identity/types";

import { saveConversationAsNote } from "../actions/save-conversation-as-note";

interface Props {
  conversationId: string;
  subjects: Subject[];
  defaultSubjectId?: string | null;
}

export function SaveChatAsNoteButton({
  conversationId,
  subjects,
  defaultSubjectId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState<string>(
    defaultSubjectId ?? subjects[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  async function onSave() {
    if (!subjectId) {
      toast.error("Pick a subject");
      return;
    }
    setSaving(true);
    const res = await saveConversationAsNote({ conversationId, subjectId });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setSavedNoteId(res.data.noteId);
    toast.success("Saved chat to your notes");
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSavedNoteId(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Save whole chat as a note"
      >
        <BookmarkPlus className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save this chat as a note</DialogTitle>
            <DialogDescription>
              We&apos;ll flatten every turn into a single note you can
              read and edit later. Attachments stay in the chat.
            </DialogDescription>
          </DialogHeader>

          {savedNoteId ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/12 text-success">
                <Check className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-[13.5px] font-bold">Saved to your notes.</p>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/app/notes/${savedNoteId}`}>Open note</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 py-2">
                <Label htmlFor="save-chat-subject">Subject</Label>
                <select
                  id="save-chat-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={onSave} loading={saving}>
                  Save chat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
