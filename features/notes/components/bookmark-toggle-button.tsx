"use client";

import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { toggleBookmark } from "../actions/toggle-bookmark";

interface BookmarkToggleButtonProps {
  noteId: string;
  isBookmarked: boolean;
}

/**
 * Optimistic bookmark toggle. Uses `useTransition` so the icon updates
 * immediately; if the server disagrees, the toast surfaces the error and
 * a router refresh (via the Server Action's revalidatePath) reconciles state.
 */
export function BookmarkToggleButton({
  noteId,
  isBookmarked: initial,
}: BookmarkToggleButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const next = !initial;
    startTransition(async () => {
      const result = await toggleBookmark({ id: noteId, isBookmarked: next });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={initial}
      aria-label={initial ? "Remove bookmark" : "Bookmark note"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        pending && "opacity-60",
      )}
    >
      <Bookmark
        className={cn("h-[18px] w-[18px]", initial ? "text-primary" : "text-muted-foreground")}
        strokeWidth={1.8}
        fill={initial ? "currentColor" : "none"}
      />
    </button>
  );
}
