import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { listNotes } from "@/features/notes/actions/list-notes";
import { NotesEmptyState } from "@/features/notes/components/notes-empty-state";
import { NotesGrid } from "@/features/notes/components/notes-grid";
import { NotesToolbar } from "@/features/notes/components/notes-toolbar";

export const metadata: Metadata = { title: "Notes" };

interface NotesPageProps {
  searchParams: Promise<{ subject?: string; chapter?: string; q?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { subject, chapter, q } = await searchParams;
  const [profile, notesResult, t] = await Promise.all([
    getMyProfile(),
    listNotes({ subjectId: subject, chapterId: chapter, search: q }),
    getTranslations("notes"),
  ]);

  if (!profile) return null;
  if (!notesResult.ok) {
    return (
      <div className="mx-auto max-w-[780px] px-5 py-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
        <ErrorState title="Couldn't load notes" description={notesResult.error.message} />
      </div>
    );
  }

  const hasFilters = Boolean(subject) || Boolean(chapter) || Boolean(q);
  const notes = notesResult.data.items;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] flex-col gap-3.5 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">{t("title")}</h1>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="icon" className="lg:hidden" aria-label={t("newNote")}>
                <Link href="/app/notes/new">
                  <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                </Link>
              </Button>
              <Button asChild className="hidden lg:inline-flex">
                <Link href="/app/notes/new">
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("newNote")}
                </Link>
              </Button>
            </div>
          </div>
          <Suspense fallback={<ToolbarSkeleton />}>
            <NotesToolbar subjects={profile.subjects} />
          </Suspense>
        </div>
      </header>

      <section className="pt-5" aria-label="Notes list">
        {notes.length === 0 ? (
          <NotesEmptyState hasFilters={hasFilters} />
        ) : (
          <NotesGrid notes={notes} />
        )}
      </section>
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      <Skeleton className="h-[46px] w-full" />
      <div className="flex gap-2 overflow-hidden">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
