import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { globalSearch } from "@/features/search/actions/search";
import { SearchInput } from "@/features/search/components/search-input";
import { SearchResults } from "@/features/search/components/search-results";

export const metadata: Metadata = { title: "Search" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const [{ q }, t] = await Promise.all([searchParams, getTranslations("search")]);
  const query = q ?? "";
  const result = await globalSearch(query);
  const results = result.ok
    ? result.data
    : { query, notes: [], files: [], tasks: [], community: [], total: 0 };

  return (
    <div className="mx-auto max-w-[820px] px-5 pb-10 sm:px-7 lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:px-11 lg:pt-6">
          <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">
            {t("title")}
          </h1>
          <SearchInput initialValue={query} placeholder={t("placeholder")} />
        </div>
      </header>

      <section aria-label={t("resultsLabel")} className="pt-5">
        <SearchResults results={results} />
      </section>
    </div>
  );
}
