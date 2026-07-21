export type FlashcardDeckSource = "ai_topic" | "ai_note" | "manual";

export interface FlashcardDeck {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  source: FlashcardDeckSource;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  ordinal: number;
  front: string;
  back: string;
  hint: string | null;
  easeFactor: number;
  intervalDays: number;
  repetition: number;
  dueAt: string;
  lastReviewedAt: string | null;
  lapses: number;
  totalReviews: number;
}

export interface FlashcardDeckWithCards extends FlashcardDeck {
  cards: Flashcard[];
}

export interface FlashcardDeckListItem
  extends Pick<
    FlashcardDeck,
    "id" | "title" | "subjectId" | "subjectName" | "source" | "createdAt" | "updatedAt"
  > {
  totalCards: number;
  dueCards: number;
  newCards: number;
}

/**
 * Review quality — the four buttons the student taps after flipping a card.
 * We map these to SM-2 quality scores (0-5) inside the review helper:
 *   again → 0, hard → 3, good → 4, easy → 5
 */
export type ReviewQuality = "again" | "hard" | "good" | "easy";

export interface CardReviewState {
  easeFactor: number;
  intervalDays: number;
  repetition: number;
  dueAt: string;
  lapses: number;
  totalReviews: number;
  lastReviewedAt: string;
}
