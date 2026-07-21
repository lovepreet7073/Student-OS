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
import { LibraryViewTabs } from "@/features/notes/components/library-view-tabs";
import { NotesEmptyState } from "@/features/notes/components/notes-empty-state";
import { NotesGrid } from "@/features/notes/components/notes-grid";
import { NotesToolbar } from "@/features/notes/components/notes-toolbar";
import { listChapters } from "@/features/study-space/actions/list-chapters";
import { listLibraryItems } from "@/features/study-space/actions/list-items";
import { FileUploadButton } from "@/features/study-space/components/file-upload-button";
import { LibraryEmptyState } from "@/features/study-space/components/library-empty-state";
import { LibraryGrid } from "@/features/study-space/components/library-grid";
import { LibraryToolbar } from "@/features/study-space/components/library-toolbar";

export const metadata: Metadata = { title: "Library" };

interface Props {
  searchParams: Promise<{
    view?: string;
    subject?: string;
    chapter?: string;
    bookmarked?: string;
    q?: string;
  }>;
}

/**
 * Unified Library — notes + files under one roof (Module 58).
 *
 * `?view=files` shows the study-space file grid; anything else falls
 * back to notes. Both views share:
 *   - The same page shell (sticky header, subject filter chips).
 *   - The same count badges in the tab strip.
 *   - The same "Create" button in the header, context-aware per view.
 *
 * We deliberately KEEP `/app/notes` as the canonical URL (rather than
 * inventing `/app/library`) so every existing deep link into notes
 * still works. `/app/library` redirects here with `view=files`.
 */
export default async function LibraryPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = params.view === "files" ? "files" : "notes";

  const [profile, t] = await Promise.all([
    getMyProfile(),
    getTranslations("notes"),
  ]);
  if (!profile) return null;

  // Counts for the tab badges — fetched even for the inactive tab so
  // students can see at a glance how much lives on the other side.
  const [notesResult, filesResult, chaptersResult] = await Promise.all([
    listNotes({
      subjectId: params.subject,
      chapterId: params.chapter,
      search: params.q,
    }),
    listLibraryItems({
      subjectId: params.subject,
      chapterId: params.chapter,
      bookmarkedOnly: params.bookmarked === "1",
      search: params.q,
    }),
    listChapters(),
  ]);

  const notesCount = notesResult.ok ? notesResult.data.items.length : 0;
  const filesCount = filesResult.ok ? filesResult.data.length : 0;
  const hasFilters = Boolean(
    params.subject || params.chapter || params.q || params.bookmarked === "1",
  );

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] flex-col gap-3.5 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                Library
              </h1>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                {view === "files"
                  ? "Uploaded PDFs, images, and scanned notes."
                  : "Your written notes."}
              </p>
            </div>
            {view === "files" ? (
              <FileUploadButton
                subjects={profile.subjects}
                defaultSubjectId={params.subject}
                defaultChapterId={params.chapter ?? null}
              />
            ) : (
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
            )}
          </div>

          <LibraryViewTabs
            active={view}
            notesCount={notesCount}
            filesCount={filesCount}
          />

          <Suspense fallback={<ToolbarSkeleton />}>
            {view === "files" ? (
              <LibraryToolbar
                subjects={profile.subjects}
                chapters={chaptersResult.ok ? chaptersResult.data : []}
              />
            ) : (
              <NotesToolbar subjects={profile.subjects} />
            )}
          </Suspense>
        </div>
      </header>

      <section
        className="pt-5"
        aria-label={view === "files" ? "Files list" : "Notes list"}
      >
        {view === "files" ? (
          !filesResult.ok ? (
            <ErrorState
              title="Couldn't load your files"
              description={filesResult.error.message}
            />
          ) : filesResult.data.length === 0 ? (
            <LibraryEmptyState hasFilters={hasFilters} />
          ) : (
            <LibraryGrid files={filesResult.data} />
          )
        ) : !notesResult.ok ? (
          <ErrorState
            title="Couldn't load notes"
            description={notesResult.error.message}
          />
        ) : notesResult.data.items.length === 0 ? (
          <NotesEmptyState hasFilters={hasFilters} />
        ) : (
          <NotesGrid notes={notesResult.data.items} />
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
