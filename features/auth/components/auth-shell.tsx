import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/layout/logo";

interface AuthShellProps {
  /** Small overline above the title, e.g. "Log in" / "Sign up". */
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * The branded marketing panel shown on lg+ screens on the LEFT side (deck
   * slides 5–6). If omitted a minimal hint panel is rendered — used for
   * forgot / reset password.
   */
  marketingPanel?: ReactNode;
}

/**
 * Split-screen auth layout (Auth v2).
 * Mobile (< lg): single column, form + logo top-left. Marketing panel hidden.
 * lg+: branded marketing panel on the LEFT, form on the RIGHT.
 *
 * The shell owns the outer chrome (viewport height, padding, logo, title).
 * Marketing content is composed per page so login/signup can look different
 * without touching this file.
 */
export async function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  marketingPanel,
}: AuthShellProps) {
  const t = await getTranslations("auth");
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
      <div className="hidden lg:block">{marketingPanel ?? (await MinimalMarketing())}</div>

      <div className="flex flex-col px-safe">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-10 sm:py-14 lg:px-10">
          <div className="flex items-center justify-between">
            <Logo priority variant="responsive" size="md" />
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[12.5px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={t("shellHome")}
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
              {t("shellHome")}
            </Link>
          </div>

          <div className="flex flex-col gap-1.5">
            {eyebrow ? (
              <span className="text-[11.5px] font-bold uppercase tracking-wide text-primary">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">{title}</h1>
            {description ? (
              <p className="text-[14px] text-muted-foreground sm:text-[15px]">{description}</p>
            ) : null}
          </div>

          <div>{children}</div>

          {footer ? <div className="text-center text-[13px]">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

async function MinimalMarketing() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-info p-12 text-primary-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent_70%)]"
      />
      <div className="relative flex items-center gap-2">
        <Logo variant="mark" size="md" href={null} />
        <span className="text-[15px] font-extrabold tracking-tight">StudyOS</span>
      </div>
      <div className="relative flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
          <Sparkles className="h-3 w-3" strokeWidth={2.4} aria-hidden />
          A calmer way to study
        </span>
        <h2 className="max-w-sm text-balance text-[30px] font-extrabold leading-[1.1] tracking-tight">
          Focus mode. Your notes. Your plan. All in one place.
        </h2>
      </div>
      <div className="relative text-[11.5px] font-semibold opacity-80">
        © {new Date().getFullYear()} StudyOS
      </div>
    </div>
  );
}
