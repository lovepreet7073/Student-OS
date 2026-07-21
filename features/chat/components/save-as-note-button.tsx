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

import { saveMessageAsNote } from "../actions/save-message-as-note";

interface Props {
  messageId: string;
  subjects: Subject[];
  defaultSubjectId?: string | null;
}

export function SaveAsNoteButton({
  messageId,
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
    const res = await saveMessageAsNote({ messageId, subjectId });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setSavedNoteId(res.data.noteId);
    toast.success("Saved to your notes");
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSavedNoteId(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Save this reply as a note"
      >
        <BookmarkPlus className="h-3 w-3" aria-hidden />
        Save
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save this reply as a note</DialogTitle>
            <DialogDescription>
              We&apos;ll copy the AI&apos;s answer into your notes library so you can
              find and edit it later.
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
                <Label htmlFor="save-note-subject">Subject</Label>
                <select
                  id="save-note-subject"
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
                  Save note
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
