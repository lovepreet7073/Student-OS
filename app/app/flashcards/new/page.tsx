import type { Metadata } from "next";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { DeckGeneratorForm } from "@/features/flashcards/components/deck-generator-form";

export const metadata: Metadata = { title: "New deck" };

interface NewDeckPageProps {
  searchParams: Promise<{ subject?: string; topic?: string; noteId?: string }>;
}

export default async function NewDeckPage({ searchParams }: NewDeckPageProps) {
  const [profile, params] = await Promise.all([getMyProfile(), searchParams]);
  if (!profile) return null;

  const prefillSubject =
    params.subject && profile.subjects.some((s) => s.id === params.subject)
      ? params.subject
      : undefined;

  return (
    <DeckGeneratorForm
      subjects={profile.subjects}
      defaultSubjectId={prefillSubject}
      defaultTopic={params.topic}
      defaultSourceNoteId={params.noteId}
    />
  );
}
