import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNote } from "@/features/notes/actions/get-note";
import { NoteDetailView } from "@/features/notes/components/note-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getNote(id);
  return { title: result.ok ? result.data.title : "Note" };
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getNote(id);
  if (!result.ok) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <NoteDetailView note={result.data} />
    </div>
  );
}
