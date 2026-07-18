import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "mark" | "full" | "responsive";

interface LogoProps {
  /** If set, the logo is wrapped in a link. Pass `null` for a non-link render. */
  href?: string | null;
  /**
   * - `mark` — icon only.
   * - `full` — icon + "StudyOS" wordmark.
   * - `responsive` — mark on mobile, mark + wordmark from `sm:` up. Best for site headers.
   * Defaults to `full`.
   */
  variant?: LogoVariant;
  size?: LogoSize;
  /** `priority` for above-the-fold placements (e.g. site header). */
  priority?: boolean;
  className?: string;
}

const dimensions: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  sm: { mark: 24, text: "text-sm", gap: "gap-1.5" },
  md: { mark: 32, text: "text-base", gap: "gap-2" },
  lg: { mark: 40, text: "text-lg", gap: "gap-2.5" },
};

export function Logo({
  href = "/",
  variant = "full",
  size = "md",
  priority = false,
  className,
}: LogoProps) {
  const { mark, text, gap } = dimensions[size];
  const wordmarkVisibility =
    variant === "mark" ? "hidden" : variant === "responsive" ? "hidden sm:inline" : "inline";

  // When wrapped in a Link (aria-label is on the link) OR when a visible wordmark is present,
  // the image is decorative. Only give it an accessible name when it's the sole cue.
  const isDecorative = href !== null || variant !== "mark";

  const body = (
    <span
      className={cn("inline-flex items-center font-semibold tracking-tight", gap, className)}
    >
      <Image
        src="/brand/logo-mark.png"
        alt={isDecorative ? "" : "StudyOS"}
        aria-hidden={isDecorative || undefined}
        width={mark}
        height={mark}
        priority={priority}
        className="shrink-0 rounded-md"
      />
      <span className={cn(text, wordmarkVisibility)}>StudyOS</span>
    </span>
  );

  if (href === null) return body;

  return (
    <Link href={href} aria-label="StudyOS home" className="inline-flex">
      {body}
    </Link>
  );
}
