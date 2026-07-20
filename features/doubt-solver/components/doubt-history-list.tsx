import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";

import type { Doubt } from "../types";

interface Props {
  doubts: Doubt[];
}

export function DoubtHistoryList({ doubts }: Props) {
  if (doubts.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {doubts.map((d) => (
        <li key={d.id}>
          <Link
            href={`/app/doubt/${d.id}`}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <StatusIcon status={d.status} />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[14px] font-bold">{d.question}</div>
              <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">
                {formatRelativeTime(d.createdAt)}
                {d.status === "processing" ? " · thinking…" : null}
                {d.status === "failed" ? " · failed" : null}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusIcon({ status }: { status: Doubt["status"] }) {
  if (status === "answered") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success/12 text-success"
      >
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        aria-hidden
        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-danger/12 text-danger"
      >
        <XCircle className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"
    >
      <Clock className="h-3.5 w-3.5 animate-pulse" strokeWidth={2.4} />
    </span>
  );
}
