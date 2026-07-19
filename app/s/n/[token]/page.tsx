import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { getPublicNote } from "@/features/notes/actions/get-public-note";
import { formatRelativeTime } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Shared note",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * Public read-only note view. Anonymous access is enforced at the RLS layer:
 * the anon key can only return rows where `visibility = 'link'`. If the
 * author revokes access, the query returns no rows and we 404.
 */
export default async function PublicNotePage({ params }: Props) {
  const { token } = await params;
  const result = await getPublicNote(token);
  if (!result.ok) notFound();

  const note = result.data;

  return (
    <div className="mx-auto flex min-h-svh max-w-[720px] flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-6 flex items-center justify-between">
        <Logo variant="responsive" size="md" />
        <Link
          href="/signup"
          className="text-[12.5px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Get StudyOS free →
        </Link>
      </header>

      <article className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center rounded-full bg-primary/12 px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-primary">
            {note.subjectName}
          </span>
          <span>Shared {formatRelativeTime(note.createdAt)}</span>
          <span>· by {note.authorDisplayName}</span>
        </div>

        <h1 className="text-balance text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
          {note.title}
        </h1>

        <section
          className="rounded-xl border border-border bg-card p-5 sm:p-7"
          aria-label="Note content"
        >
          {note.content.trim().length === 0 ? (
            <p className="text-sm text-muted-foreground">This note is empty.</p>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-[14.5px] leading-relaxed text-foreground">
              {note.content}
            </pre>
          )}
        </section>
      </article>

      <footer className="mt-auto pt-10 text-center text-[12px] text-muted-foreground/80">
        Shared read-only via StudyOS ·{" "}
        <Link href="/" className="font-semibold text-primary hover:underline">
          Learn more
        </Link>
      </footer>
    </div>
  );
}
