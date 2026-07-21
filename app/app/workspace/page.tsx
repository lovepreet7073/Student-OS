import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getWorkspaceOverview } from "@/features/workspace/actions/get-workspace-overview";
import { CategoryGrid } from "@/features/workspace/components/category-grid";
import { QuickActions } from "@/features/workspace/components/quick-actions";

export const metadata: Metadata = { title: "Workspace" };

/**
 * Workspace — the browsable directory of every content type. It is
 * NOT "what to do now" — that's Today's job. It is NOT "current
 * activity" — Today's <ContinueCard> covers that. Workspace's job
 * post-redesign is simple: help a student find a feature they know
 * exists but can't remember the name of.
 *
 * Module 63 killed the "Recently opened" and "Recently uploaded"
 * sections — both were duplicated by the new <ContinueCard> on Today,
 * where they belong (the "one page a student opens at 9 PM").
 * Workspace is now three things top-to-bottom: quick actions, the
 * intent-grouped category grid, and search.
 */
export default async function WorkspacePage() {
  const [profile, overview, t] = await Promise.all([
    getMyProfile(),
    getWorkspaceOverview(),
    getTranslations("workspace"),
  ]);
  if (!profile) return null;

  const firstName =
    profile.displayName.trim().split(/\s+/)[0] ?? profile.displayName;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-end justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <div className="text-[12.5px] font-semibold text-muted-foreground/80">
              {t("greeting", { name: firstName })}
            </div>
            <h1 className="mt-0.5 text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              {t("title")}
            </h1>
          </div>
          <Button asChild variant="outline" size="icon" aria-label="Search">
            <Link href="/app/search">
              <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label={t("quickActionsLabel")} className="pt-5">
        <QuickActions />
      </section>

      <section aria-label={t("categoriesLabel")} className="pt-8">
        <div className="mb-4">
          <h2 className="text-[15px] font-extrabold tracking-tight">
            {t("categoriesLabel")}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Grouped by what you&apos;re trying to do. Not sure where
            something lives?{" "}
            <Link
              href="/app/help"
              className="font-bold text-primary underline underline-offset-2"
            >
              Ask the Helper
            </Link>
            .
          </p>
        </div>
        {!overview.ok ? (
          <ErrorState
            title={t("errors.overview")}
            description={overview.error.message}
          />
        ) : (
          <CategoryGrid overview={overview.data} />
        )}
      </section>
    </div>
  );
}
