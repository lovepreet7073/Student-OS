import { z } from "zod";

/**
 * Shape Gemini must produce for a flashcard deck. Mirrors the contract in
 * `buildFlashcardsPrompt`. `generateStructured` retries once if this fails
 * to validate.
 *
 * The `superRefine` guards the "front === back" and "empty hint" failure
 * modes we've seen in prompt tuning.
 */
export const geminiFlashcardSchema = z
  .object({
    front: z.string().trim().min(1).max(500),
    back: z.string().trim().min(1).max(2000),
    hint: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .superRefine((val, ctx) => {
    if (val.front.toLowerCase() === val.back.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "front and back must carry different information",
      });
    }
  });

export const geminiFlashcardsResponseSchema = z.object({
  cards: z.array(geminiFlashcardSchema).min(3).max(40),
});

export type GeminiFlashcardsResponse = z.infer<typeof geminiFlashcardsResponseSchema>;
