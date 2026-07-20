import Link from "next/link";
import { Brain, Plus, Sparkles, Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Four CTAs across the top of the workspace hub. Buttons are icon+label
 * cards so they read equally well on mobile (stacked) and desktop (row).
 */
export async function QuickActions() {
  const t = await getTranslations("workspace.quickActions");

  const actions = [
    { key: "newNote",  icon: Plus,     href: "/app/notes/new", tone: "primary" as const },
    { key: "askAi",    icon: Brain,    href: "/app/doubt",     tone: "brand"   as const },
    { key: "newQuiz",  icon: Sparkles, href: "/app/study/new", tone: "success" as const },
    { key: "upload",   icon: Upload,   href: "/app/library",   tone: "danger"  as const },
  ];

  const TONES = {
    primary: "bg-primary/10 text-primary",
    brand:   "bg-brand-accent/12 text-brand-accent",
    success: "bg-success/12 text-success",
    danger:  "bg-danger/12 text-danger",
  } as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => (
        <Link
          key={a.key}
          href={a.href}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden
            className={`flex h-10 w-10 items-center justify-center rounded-md ${TONES[a.tone]}`}
          >
            <a.icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-extrabold tracking-tight">
              {t(`${a.key}.title`)}
            </div>
            <div className="truncate text-[11.5px] text-muted-foreground">
              {t(`${a.key}.hint`)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
