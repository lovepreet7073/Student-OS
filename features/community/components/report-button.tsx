"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { reportCommunityNote } from "../actions/report-community-note";

interface Props {
  noteId: string;
}

export function ReportButton({ noteId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, start] = useTransition();

  function onSubmit() {
    if (reason.trim().length < 3) {
      toast.error("Tell us briefly what's wrong.");
      return;
    }
    start(async () => {
      const result = await reportCommunityNote({ id: noteId, reason });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Report sent. A teacher will take a look.");
      setOpen(false);
      setReason("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-11 gap-2">
          <Flag className="h-4 w-4" strokeWidth={2} aria-hidden />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this note</DialogTitle>
          <DialogDescription>
            A teacher will review it. Please be specific — this helps them respond faster.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-reason">Reason</Label>
          <textarea
            id="report-reason"
            className="min-h-[100px] rounded-md border border-border bg-card p-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Spam, off-topic, incorrect info…"
            maxLength={500}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isPending}>
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
