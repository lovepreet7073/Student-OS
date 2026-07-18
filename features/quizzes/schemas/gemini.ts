import { z } from "zod";

/**
 * Shape Gemini must produce. Mirrors `buildQuizPrompt`'s contract.
 * `generateStructured` retries once if this fails to validate.
 */
export const geminiQuestionSchema = z
  .object({
    type: z.enum(["mcq", "true_false", "fill_blank", "short_answer"]),
    question: z.string().trim().min(1),
    options: z.array(z.string()).default([]),
    correct_answer: z.string().trim().min(1),
    explanation: z.string().trim().default(""),
  })
  .superRefine((val, ctx) => {
    if (val.type === "mcq") {
      if (val.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MCQ must have exactly 4 options",
        });
      } else if (!val.options.includes(val.correct_answer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MCQ correct_answer must match one of the options",
        });
      }
    }
    if (val.type === "true_false") {
      const lower = val.correct_answer.toLowerCase();
      if (lower !== "true" && lower !== "false") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "true_false correct_answer must be 'true' or 'false'",
        });
      }
    }
  });

export const geminiQuizResponseSchema = z.object({
  questions: z.array(geminiQuestionSchema).min(1).max(25),
});

export type GeminiQuizResponse = z.infer<typeof geminiQuizResponseSchema>;
