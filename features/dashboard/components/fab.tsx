import Link from "next/link";
import { Plus } from "lucide-react";

interface FabProps {
  href: string;
  label: string;
}

/**
 * Floating action button. Positioned above the mobile bottom nav (which is
 * ~66px tall + safe-area). Hidden on desktop where the sidebar's primary CTA
 * takes its place.
 */
export function Fab({ href, label }: FabProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed right-5 z-30 flex h-[58px] w-[58px] items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_26px_-6px_hsl(var(--primary)/0.65)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
      style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
    >
      <Plus className="h-[26px] w-[26px]" strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
