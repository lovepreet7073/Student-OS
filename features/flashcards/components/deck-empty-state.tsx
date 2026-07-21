import Link from "next/link";
import { Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function DeckEmptyState() {
  return (
    <EmptyState
      icon={Layers}
      title="No flashcard decks yet"
      description="Pick a topic and AI will build a deck of question–answer cards. Study with spaced repetition — the harder ones come back more often."
      action={
        <Button asChild>
          <Link href="/app/flashcards/new">
            <Layers className="h-4 w-4" aria-hidden />
            Generate your first deck
          </Link>
        </Button>
      }
    />
  );
}
