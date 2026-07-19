"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

import type { Audience } from "../types";
import { AudienceToggle } from "./audience-toggle";
import { LandingFeatureGrid } from "./landing-feature-grid";
import { LandingPreview } from "./landing-preview";
import { LandingSocialProof } from "./landing-social-proof";

/**
 * Top-level landing experience — owns the audience state so the toggle can
 * swap hero + feature copy in place without changing layout (deck slide 2).
 * Sits inside the marketing background rendered by `app/page.tsx`.
 */
export function LandingExperience() {
  const t = useTranslations("landing");
  const [audience, setAudience] = useState<Audience>("student");
  const heroEyebrow = t(`audience.${audience}`);
  const heroHeading = t(`hero.${audience}.heading`);
  const heroSub = t(`hero.${audience}.sub`);
  const heroCta = t(`hero.${audience}.cta`);
  const sectionHeading = t(`section.${audience}.heading`);
  const sectionSub = t(`section.${audience}.sub`);

  return (
    <main className="relative flex min-h-svh flex-col px-safe">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Logo priority variant="responsive" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">{t("signIn")}</Link>
          </Button>
          <Button asChild>
            <Link href={`/signup?as=${audience}`}>
              {t("getStarted")}
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-5 pb-10 pt-6 sm:px-8 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-16 lg:pt-12">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <AudienceToggle value={audience} onChange={setAudience} />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3 text-brand-accent" aria-hidden />
            {heroEyebrow}
          </span>

          <h1 className="text-balance text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-[44px] lg:text-[52px]">
            {heroHeading}
          </h1>

          <p className="max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
            {heroSub}
          </p>

          <div className="flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row">
            <Button asChild size="lg" fullWidth className="sm:w-auto">
              <Link href={`/signup?as=${audience}`}>
                {heroCta}
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" fullWidth className="sm:w-auto">
              <Link href="/login">{t("signIn")}</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:mx-0">
          <LandingPreview audience={audience} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pt-4 sm:px-8">
        <LandingSocialProof />
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="text-[11.5px] font-bold uppercase tracking-wide text-primary">
            {t("sectionOverline")}
          </span>
          <h2 className="text-balance text-[28px] font-extrabold tracking-tight sm:text-[34px]">
            {sectionHeading}
          </h2>
          <p className="max-w-xl text-balance text-[14.5px] text-muted-foreground sm:text-[16px]">
            {sectionSub}
          </p>
        </div>
        <LandingFeatureGrid audience={audience} />
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 pb-safe pt-6 text-center text-[12.5px] text-muted-foreground sm:px-8 sm:pb-10">
        &copy; {new Date().getFullYear()} StudyOS · {t("footer")}
      </footer>
    </main>
  );
}
