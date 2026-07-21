import Link from "next/link";
import { Layers } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  noteId: string;
  subjectId: string;
  noteTitle: string;
}

/**
 * Deep-links the note into the flashcard generator with the subject and
 * topic pre-filled and `sourceNoteId` set. `generateDeck` reads the note
 * body server-side (RLS guarantees ownership) and grounds the AI prompt
 * in that content instead of the model's general knowledge.
 */
export function MakeFlashcardsButton({ noteId, subjectId, noteTitle }: Props) {
  const search = new URLSearchParams({
    subject: subjectId,
    topic: noteTitle.slice(0, 200),
    noteId,
  });
  return (
    <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
      <Link href={`/app/flashcards/new?${search.toString()}`}>
        <Layers className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Make flashcards
      </Link>
    </Button>
  );
}
