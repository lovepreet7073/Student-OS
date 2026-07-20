import Link from "next/link";
import { BookText, FileText, FolderOpen, GraduationCap, PlusCircle } from "lucide-react";

import type { SyllabusTree } from "../actions/get-syllabus-tree";

interface Props {
  tree: SyllabusTree;
}

const SUBJECT_TONES = [
  { color: "#5B5FDB", tint: "rgba(91, 95, 219, 0.12)" },
  { color: "#E5533C", tint: "rgba(229, 83, 60, 0.12)" },
  { color: "#E8A13A", tint: "rgba(232, 161, 58, 0.12)" },
  { color: "#2FB57C", tint: "rgba(47, 181, 124, 0.12)" },
  { color: "#8B5CF6", tint: "rgba(139, 92, 246, 0.12)" },
];

/**
 * Server-rendered syllabus tree: subject cards, each with an expandable
 * list of chapters. Each chapter row deep-links to a filtered notes list.
 * If a subject has zero chapters, we surface a "Create your first chapter"
 * CTA that opens the Library (that's the current place chapters are created).
 */
export function SyllabusTreeView({ tree }: Props) {
  if (tree.subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
        <div className="text-[14px] font-bold">No subjects yet</div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Finish onboarding to pick your subjects, then chapters appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {tree.subjects.map((subject, idx) => {
        const tone = SUBJECT_TONES[idx % SUBJECT_TONES.length]!;
        const hasContent = subject.chapters.length > 0 || subject.looseNotes + subject.looseFiles > 0;

        return (
          <section
            key={subject.id}
            aria-label={subject.name}
            className="rounded-xl border border-border bg-card"
          >
            <header className="flex items-center gap-3 border-b border-border p-4">
              <span
                aria-hidden
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: tone.tint, color: tone.color }}
              >
                <GraduationCap className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-extrabold tracking-tight">{subject.name}</h2>
                <div className="mt-0.5 flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                  <span>{subject.chapters.length} chapters</span>
                  <span>·</span>
                  <span>{subject.totalNotes} notes</span>
                  <span>·</span>
                  <span>{subject.totalFiles} files</span>
                </div>
              </div>
              <Link
                href={`/app/notes?subject=${subject.id}`}
                className="hidden text-[11.5px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline"
              >
                Open all →
              </Link>
            </header>

            {hasContent ? (
              <ul className="flex flex-col divide-y divide-border">
                {subject.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <ChapterRow
                      subjectId={subject.id}
                      chapterId={chapter.id}
                      name={chapter.name}
                      noteCount={chapter.noteCount}
                      fileCount={chapter.fileCount}
                    />
                  </li>
                ))}
                {subject.looseNotes + subject.looseFiles > 0 ? (
                  <li>
                    <LooseRow
                      subjectId={subject.id}
                      noteCount={subject.looseNotes}
                      fileCount={subject.looseFiles}
                    />
                  </li>
                ) : null}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3 p-4">
                <p className="text-[12.5px] text-muted-foreground">
                  No chapters yet. Create them from Library, or add notes without a chapter first.
                </p>
                <Link
                  href="/app/library"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-bold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PlusCircle className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                  Create chapter in Library
                </Link>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ChapterRow({
  subjectId,
  chapterId,
  name,
  noteCount,
  fileCount,
}: {
  subjectId: string;
  chapterId: string;
  name: string;
  noteCount: number;
  fileCount: number;
}) {
  return (
    <Link
      href={`/app/notes?subject=${subjectId}&chapter=${chapterId}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <span
        aria-hidden
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
      >
        <FolderOpen className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{name}</span>
      <span className="flex flex-shrink-0 items-center gap-3 text-[11.5px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BookText className="h-3 w-3" strokeWidth={2} aria-hidden />
          {noteCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3 w-3" strokeWidth={2} aria-hidden />
          {fileCount}
        </span>
      </span>
    </Link>
  );
}

function LooseRow({
  subjectId,
  noteCount,
  fileCount,
}: {
  subjectId: string;
  noteCount: number;
  fileCount: number;
}) {
  return (
    <Link
      href={`/app/notes?subject=${subjectId}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <span
        aria-hidden
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
      >
        <FolderOpen className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-muted-foreground">
        Loose (no chapter)
      </span>
      <span className="flex flex-shrink-0 items-center gap-3 text-[11.5px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BookText className="h-3 w-3" strokeWidth={2} aria-hidden />
          {noteCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3 w-3" strokeWidth={2} aria-hidden />
          {fileCount}
        </span>
      </span>
    </Link>
  );
}
