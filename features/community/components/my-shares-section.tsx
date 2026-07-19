"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Trash2, XCircle } from "lucide-react";
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
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

import { deleteMyShare } from "../actions/delete-my-share";
import type { MyShareItem } from "../actions/list-my-shares";
import type { CommunityNoteStatus } from "../types";

interface Props {
  buckets: Record<CommunityNoteStatus, MyShareItem[]>;
}

const STATUS_ORDER: CommunityNoteStatus[] = ["pending", "approved", "rejected"];

const STATUS_META: Record<CommunityNoteStatus, { label: string; icon: typeof Clock; tone: string }> = {
  pending: {
    label: "Waiting for review",
    icon: Clock,
    tone: "bg-warning/12 text-warning border-warning/30",
  },
  approved: {
    label: "Live",
    icon: CheckCircle2,
    tone: "bg-success/12 text-success border-success/30",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    tone: "bg-danger/12 text-danger border-danger/30",
  },
};

export function MySharesSection({ buckets }: Props) {
  const total = STATUS_ORDER.reduce((sum, s) => sum + buckets[s].length, 0);
  const router = useRouter();
  const [confirmFor, setConfirmFor] = useState<MyShareItem | null>(null);
  const [isPending, start] = useTransition();

  function onConfirm() {
    if (!confirmFor) return;
    start(async () => {
      const result = await deleteMyShare(confirmFor.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Unshared.");
      setConfirmFor(null);
      router.refresh();
    });
  }

  if (total === 0) {
    return (
      <section
        aria-label="Your shared notes"
        className="mb-5 rounded-xl border border-dashed border-border bg-card/60 p-5 text-center"
      >
        <div className="text-[14px] font-bold">You haven't shared any notes yet</div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Open any note and tap the share icon to send it to the community.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Your shared notes" className="mb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold tracking-tight">Your shared notes</h2>
        <span className="text-[11.5px] font-bold text-muted-foreground">{total} total</span>
      </div>

      {STATUS_ORDER.map((status) => {
        const items = buckets[status];
        if (items.length === 0) return null;
        const meta = STATUS_META[status];

        return (
          <div key={status} className="flex flex-col gap-2">
            <div className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide",
              meta.tone,
            )}>
              <meta.icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
              {meta.label}
              <span className="opacity-70">· {items.length}</span>
            </div>

            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/app/community/${item.id}`}
                      className="min-w-0 flex-1 text-[14.5px] font-extrabold tracking-tight hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="line-clamp-1">{item.title}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmFor(item)}
                      aria-label={`Unshare ${item.title}`}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                    <span>{item.subjectName}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                    {status === "approved" ? (
                      <>
                        <span>·</span>
                        <span>{item.likesCount} likes</span>
                      </>
                    ) : null}
                  </div>

                  {status === "rejected" && item.rejectionReason ? (
                    <p className="mt-1 rounded-md bg-danger/10 p-2 text-[11.5px] leading-snug text-foreground">
                      <span className="font-bold text-danger">Reason:</span> {item.rejectionReason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <Dialog open={confirmFor !== null} onOpenChange={(o) => !o && setConfirmFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unshare this note?</DialogTitle>
            <DialogDescription>
              The community copy will be removed. Likes and saves peers made on this share are
              gone too. Your private note in the Notes library stays untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFor(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} loading={isPending}>
              Unshare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
