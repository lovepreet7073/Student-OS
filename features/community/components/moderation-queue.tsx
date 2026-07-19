"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
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
import { formatRelativeTime } from "@/lib/format-date";

import { moderateNote } from "../actions/moderate-note";
import type { CommunityNoteListItem } from "../types";

interface Props {
  items: CommunityNoteListItem[];
}

export function ModerationQueue({ items }: Props) {
  const router = useRouter();
  const [rejectFor, setRejectFor] = useState<CommunityNoteListItem | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, start] = useTransition();

  function onApprove(id: string) {
    start(async () => {
      const result = await moderateNote({ id, action: "approve" });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Approved — now visible to peers.");
      router.refresh();
    });
  }

  function onReject() {
    if (!rejectFor) return;
    if (reason.trim().length < 3) {
      toast.error("Give the author a short reason.");
      return;
    }
    start(async () => {
      const result = await moderateNote({
        id: rejectFor.id,
        action: "reject",
        reason,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Rejected — author sees the reason.");
      setRejectFor(null);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-warning/12 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-warning">
                {item.subjectName}
              </span>
              <span className="text-[11.5px] font-bold text-muted-foreground">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
            <div>
              <Link
                href={`/app/community/${item.id}`}
                className="text-[15.5px] font-extrabold tracking-tight hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {item.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                {item.excerpt}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold text-muted-foreground">
                by {item.authorDisplayName}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectFor(item);
                    setReason("");
                  }}
                  className="gap-1"
                  disabled={isPending}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(item.id)}
                  className="gap-1"
                  loading={isPending}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  Approve
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={rejectFor !== null} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this note</DialogTitle>
            <DialogDescription>
              The author will see this reason. Be kind — they'll learn from it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <textarea
              id="reject-reason"
              className="min-h-[100px] rounded-md border border-border bg-card p-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Incorrect answer, too short, off-syllabus…"
              maxLength={500}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={onReject} loading={isPending}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
