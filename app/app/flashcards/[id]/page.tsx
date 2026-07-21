import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDeck } from "@/features/flashcards/actions/get-deck";
import { getDeckStats } from "@/features/flashcards/actions/get-deck-stats";
import { DeckDetailView } from "@/features/flashcards/components/deck-detail-view";

export const metadata: Metadata = { title: "Flashcard deck" };

interface DeckPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  const [deckResult, statsResult] = await Promise.all([
    getDeck(id),
    getDeckStats(id),
  ]);
  if (!deckResult.ok) {
    if (deckResult.error.code === "NOT_FOUND") notFound();
    throw new Error(deckResult.error.message);
  }
  return (
    <DeckDetailView
      deck={deckResult.data}
      stats={statsResult.ok ? statsResult.data : null}
    />
  );
}
