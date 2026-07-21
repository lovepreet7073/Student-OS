import type { Metadata } from "next";

import { ErrorState } from "@/components/shared/error-state";
import { listBookmarks } from "@/features/bookmarks/actions/list-bookmarks";
import { BookmarksView } from "@/features/bookmarks/components/bookmarks-view";

export const metadata: Metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const result = await listBookmarks();

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 lg:px-11">
        <ErrorState
          title="Couldn't load your bookmarks"
          description={result.error.message}
        />
      </div>
    );
  }

  return <BookmarksView overview={result.data} />;
}
