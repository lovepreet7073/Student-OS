import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { getSyllabusTree } from "@/features/syllabus/actions/get-syllabus-tree";
import { SyllabusTreeView } from "@/features/syllabus/components/syllabus-tree-view";

export const metadata: Metadata = { title: "Syllabus" };

export default async function SyllabusPage() {
  const result = await getSyllabusTree();

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-end justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-primary">
              <GraduationCap className="h-3 w-3" strokeWidth={2.4} aria-hidden />
              Study Tree
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Syllabus</h1>
            {result.ok ? (
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {result.data.subjects.length} subjects · {result.data.totalChapters} chapters ·{" "}
                {result.data.totalNotes} notes · {result.data.totalFiles} files
              </p>
            ) : null}
          </div>
          <Button asChild size="sm" variant="outline" className="lg:hidden">
            <Link href="/app/library">Manage chapters</Link>
          </Button>
        </div>
      </header>

      <section aria-label="Subjects and chapters" className="pt-5">
        {!result.ok ? (
          <ErrorState title="Couldn't load your syllabus" description={result.error.message} />
        ) : (
          <SyllabusTreeView tree={result.data} />
        )}
      </section>
    </div>
  );
}
