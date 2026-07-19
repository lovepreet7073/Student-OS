"use client";

import { useState, useTransition } from "react";
import { Share2 } from "lucide-react";
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

import { shareNote } from "../actions/share-note";

interface Props {
  noteId: string;
}

/**
 * Sits on the notes detail page. Confirms once, submits, and toasts the
 * moderation timeline so students set expectations correctly.
 */
export function ShareToCommunityButton({ noteId }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, start] = useTransition();

  function onConfirm() {
    start(async () => {
      const result = await shareNote({ noteId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Shared! A teacher will review it before your peers see it.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Share to community">
          <Share2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this note to the community?</DialogTitle>
          <DialogDescription>
            Your note will go to a teacher for review. Once approved, peers on the same board,
            class and medium can read and save it. You can still edit your private version — the
            shared copy stays as a snapshot.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={isPending}>
            Share for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
