import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { listChapters } from "@/features/study-space/actions/list-chapters";
import { listLibraryItems } from "@/features/study-space/actions/list-items";
import { FileUploadButton } from "@/features/study-space/components/file-upload-button";
import { LibraryEmptyState } from "@/features/study-space/components/library-empty-state";
import { LibraryGrid } from "@/features/study-space/components/library-grid";
import { LibraryToolbar } from "@/features/study-space/components/library-toolbar";

export const metadata: Metadata = { title: "My Study Space" };

interface LibraryPageProps {
  searchParams: Promise<{
    subject?: string;
    chapter?: string;
    bookmarked?: string;
    q?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const [profile, chaptersResult, filesResult] = await Promise.all([
    getMyProfile(),
    listChapters(),
    listLibraryItems({
      subjectId: params.subject,
      chapterId: params.chapter,
      bookmarkedOnly: params.bookmarked === "1",
      search: params.q,
    }),
  ]);

  if (!profile) return null;

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
                My Study Space
              </h1>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                Private files — PDFs, images, scanned notes.
              </p>
            </div>
            <FileUploadButton
              subjects={profile.subjects}
              defaultSubjectId={params.subject}
              defaultChapterId={params.chapter ?? null}
            />
          </div>
          <Suspense fallback={<ToolbarSkeleton />}>
            <LibraryToolbar
              subjects={profile.subjects}
              chapters={chaptersResult.ok ? chaptersResult.data : []}
            />
          </Suspense>
        </div>
      </header>

      <section aria-label="Files" className="pt-5">
        {!filesResult.ok ? (
          <ErrorState title="Couldn't load your files" description={filesResult.error.message} />
        ) : filesResult.data.length === 0 ? (
          <LibraryEmptyState hasFilters={hasFilters} />
        ) : (
          <LibraryGrid files={filesResult.data} />
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
      </div>
    </div>
  );
}
