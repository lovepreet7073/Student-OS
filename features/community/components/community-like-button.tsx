"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { toggleLike } from "../actions/toggle-like";

interface CommunityLikeButtonProps {
  noteId: string;
  initialLiked: boolean;
  initialCount: number;
  variant?: "compact" | "expanded";
}

export function CommunityLikeButton({
  noteId,
  initialLiked,
  initialCount,
  variant = "compact",
}: CommunityLikeButtonProps) {
  const [isPending, start] = useTransition();

  function onClick() {
    start(async () => {
      const result = await toggleLike(noteId);
      if (!result.ok) toast.error(result.error.message);
    });
  }

  if (variant === "expanded") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={initialLiked}
        className={cn(
          "flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-[13px] font-bold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          initialLiked
            ? "border-danger/40 text-danger"
            : "text-foreground hover:border-danger/40 hover:text-danger",
        )}
      >
        <Heart
          className={cn("h-4 w-4", initialLiked && "fill-danger")}
          strokeWidth={2}
          aria-hidden
        />
        <span>{initialLiked ? "Liked" : "Like"}</span>
        <span className="text-muted-foreground">· {initialCount}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={initialLiked}
      aria-label={initialLiked ? "Unlike" : "Like"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        initialLiked ? "text-danger" : "text-muted-foreground hover:text-danger",
      )}
    >
      <Heart
        className={cn("h-3.5 w-3.5", initialLiked && "fill-danger")}
        strokeWidth={2}
        aria-hidden
      />
      <span>{initialCount}</span>
    </button>
  );
}
