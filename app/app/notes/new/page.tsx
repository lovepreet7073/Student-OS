import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { NoteForm } from "@/features/notes/components/note-form";
import { listChapters } from "@/features/study-space/actions/list-chapters";

export const metadata: Metadata = { title: "New note" };

export default async function NewNotePage() {
  const [profile, chaptersResult] = await Promise.all([getMyProfile(), listChapters()]);
  if (!profile) return null;
  const chapters = chaptersResult.ok ? chaptersResult.data : [];

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to notes" className="mb-5 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back to notes">
          <Link href="/app/notes">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">New note</h1>
      </nav>
      <NoteForm subjects={profile.subjects} chapters={chapters} />
    </div>
  );
}
