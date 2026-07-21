import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDeck } from "@/features/flashcards/actions/get-deck";
import { DeckDetailView } from "@/features/flashcards/components/deck-detail-view";

export const metadata: Metadata = { title: "Flashcard deck" };

interface DeckPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  const result = await getDeck(id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }
  return <DeckDetailView deck={result.data} />;
}
