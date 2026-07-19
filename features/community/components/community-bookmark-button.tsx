"use client";

import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { toggleCommunityBookmark } from "../actions/toggle-community-bookmark";

interface Props {
  noteId: string;
  initialBookmarked: boolean;
}

export function CommunityBookmarkButton({ noteId, initialBookmarked }: Props) {
  const [isPending, start] = useTransition();

  function onClick() {
    start(async () => {
      const result = await toggleCommunityBookmark(noteId);
      if (!result.ok) toast.error(result.error.message);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={initialBookmarked}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-[13px] font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        initialBookmarked
          ? "border-primary/40 text-primary"
          : "text-foreground hover:border-primary/40 hover:text-primary",
      )}
    >
      <Bookmark
        className={cn("h-4 w-4", initialBookmarked && "fill-primary")}
        strokeWidth={2}
        aria-hidden
      />
      <span>{initialBookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}
