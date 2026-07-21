import { z } from "zod";

export const generateDeckSchema = z.object({
  subjectId: z.string().uuid("Choose a subject"),
  topic: z
    .string()
    .trim()
    .min(2, "Enter a topic")
    .max(200, "Topic is too long"),
  cardCount: z.coerce.number().int().min(6).max(40).default(15),
  sourceNoteId: z.string().uuid().optional(),
});
export type GenerateDeckInput = z.infer<typeof generateDeckSchema>;

export const reviewCardSchema = z.object({
  cardId: z.string().uuid(),
  quality: z.enum(["again", "hard", "good", "easy"]),
});
export type ReviewCardInput = z.infer<typeof reviewCardSchema>;

export const deleteDeckSchema = z.object({
  deckId: z.string().uuid(),
});
export type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;
