import { cn } from "@/lib/utils";

interface UserAvatarProps {
  displayName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes: Record<Required<UserAvatarProps>["size"], string> = {
  sm: "h-9 w-9 text-[13px]",
  md: "h-[42px] w-[42px] text-[15px]",
  lg: "h-16 w-16 text-[23px]",
};

/**
 * Deterministic 2-letter avatar tinted by a stable palette derived from the
 * user's name. Matches the design's coral/indigo/green/amber/violet cycle.
 */
export function UserAvatar({ displayName, size = "md", className }: UserAvatarProps) {
  const initials = getInitials(displayName);
  const bgClass = pickTone(displayName);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white",
        sizes[size],
        bgClass,
        className,
      )}
    >
      {initials}
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const TONES = [
  "bg-danger",
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-[#8B5CF6]",
];

function pickTone(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length]!;
}
