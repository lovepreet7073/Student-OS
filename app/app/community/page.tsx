import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { listCommunityNotes } from "@/features/community/actions/list-community-notes";
import { CommunityEmptyState } from "@/features/community/components/community-empty-state";
import { CommunityFeed } from "@/features/community/components/community-feed";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const [profile, feed, t] = await Promise.all([
    getMyProfile(),
    listCommunityNotes(),
    getTranslations("community"),
  ]);
  const isTeacher = profile?.role === "teacher";

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              {t("title")}
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">{t("description")}</p>
          </div>
          {isTeacher ? (
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/app/community/moderation">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {t("moderate")}
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <section aria-label="Community feed" className="pt-5">
        {!feed.ok ? (
          <ErrorState title="Couldn't load community notes" description={feed.error.message} />
        ) : feed.data.length === 0 ? (
          <CommunityEmptyState />
        ) : (
          <CommunityFeed notes={feed.data} />
        )}
      </section>
    </div>
  );
}
