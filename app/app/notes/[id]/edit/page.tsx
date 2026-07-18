import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getNote } from "@/features/notes/actions/get-note";
import { NoteForm } from "@/features/notes/components/note-form";

export const metadata: Metadata = { title: "Edit note" };

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, noteResult] = await Promise.all([getMyProfile(), getNote(id)]);
  if (!profile) return null;
  if (!noteResult.ok) notFound();

  const note = noteResult.data;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to note" className="mb-5 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href={`/app/notes/${note.id}`}>
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">Edit note</h1>
      </nav>
      <NoteForm
        subjects={profile.subjects}
        initial={{
          id: note.id,
          title: note.title,
          content: note.content,
          subjectId: note.subjectId,
        }}
      />
    </div>
  );
}
