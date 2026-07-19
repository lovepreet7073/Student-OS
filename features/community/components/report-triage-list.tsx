"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Flag, XCircle } from "lucide-react";
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

import { dismissReports } from "../actions/dismiss-reports";
import { unpublishNote } from "../actions/unpublish-note";
import type { ReportedNoteItem } from "../actions/list-reported-notes";

interface Props {
  items: ReportedNoteItem[];
}

export function ReportTriageList({ items }: Props) {
  const router = useRouter();
  const [unpublishFor, setUnpublishFor] = useState<ReportedNoteItem | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, start] = useTransition();

  function onDismiss(id: string) {
    start(async () => {
      const result = await dismissReports(id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        result.data.dismissed === 1
          ? "Report dismissed."
          : `${result.data.dismissed} reports dismissed.`,
      );
      router.refresh();
    });
  }

  function onUnpublish() {
    if (!unpublishFor) return;
    if (reason.trim().length < 3) {
      toast.error("Add a short reason so the author knows why.");
      return;
    }
    start(async () => {
      const result = await unpublishNote({
        id: unpublishFor.id,
        action: "reject",
        reason,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Unpublished — no longer visible to peers.");
      setUnpublishFor(null);
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
              <span className="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-danger">
                <Flag className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                {item.reportsCount} report{item.reportsCount === 1 ? "" : "s"}
              </span>
              <span className="text-[11.5px] font-bold text-muted-foreground">
                latest {formatRelativeTime(item.latestReportedAt)}
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
              <p className="mt-2 rounded-md bg-danger/10 p-2.5 text-[12.5px] leading-snug text-foreground">
                <span className="font-bold">Latest reason:</span> {item.latestReason}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold text-muted-foreground">
                {item.subjectName} · by {item.authorDisplayName}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDismiss(item.id)}
                  className="gap-1"
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setUnpublishFor(item);
                    setReason("");
                  }}
                  className="gap-1"
                  disabled={isPending}
                >
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  Unpublish
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={unpublishFor !== null} onOpenChange={(o) => !o && setUnpublishFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish this note</DialogTitle>
            <DialogDescription>
              The author will see this reason. Open reports on the note are
              auto-dismissed when you unpublish.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="unpublish-reason">Reason</Label>
            <textarea
              id="unpublish-reason"
              className="min-h-[100px] rounded-md border border-border bg-card p-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contains errors, was reported for spam, off-syllabus…"
              maxLength={500}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpublishFor(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onUnpublish} loading={isPending}>
              Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
