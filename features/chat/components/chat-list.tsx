import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";

import { formatRelativeTime } from "@/lib/format-date";

import type { ChatConversationListItem } from "../types";

interface Props {
  conversations: ChatConversationListItem[];
}

export function ChatList({ conversations }: Props) {
  return (
    <ul className="flex flex-col gap-2.5">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/app/chat/${c.id}`}
            className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-accent text-primary"
            >
              <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                {c.subjectName ? (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {c.subjectName}
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold text-muted-foreground/70">
                  {formatRelativeTime(c.updatedAt)}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[15px] font-bold tracking-tight">
                {c.title}
              </div>
              {c.lastMessagePreview ? (
                <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {c.lastMessagePreview}
                </div>
              ) : null}
            </div>
            <ChevronRight
              className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground/70"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
