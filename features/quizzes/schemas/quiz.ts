import { z } from "zod";

const questionTypeSchema = z.enum([
  "mcq",
  "true_false",
  "fill_blank",
  "short_answer",
]);

export const quizModeSchema = z.enum(["quick", "board_paper"]).default("quick");
export type QuizMode = z.infer<typeof quizModeSchema>;

/**
 * Two quiz modes:
 *   - "quick": casual practice, 3-15 questions, one topic.
 *   - "board_paper": mimics a real board paper — 15-40 Qs, sectioned (MCQ
 *      then short then long), covers multiple sub-topics under one big topic.
 *      Enforced minimum of 15 Qs via superRefine so a "5-Q board paper" isn't
 *      accepted as a papered simulation.
 */
export const generateQuizSchema = z
  .object({
    subjectId: z.string().uuid("Choose a subject"),
    topic: z
      .string()
      .trim()
      .min(2, "Enter a topic")
      .max(200, "Topic is too long"),
    questionCount: z.coerce.number().int().min(3).max(40).default(10),
    questionTypes: z
      .array(questionTypeSchema)
      .min(1, "Pick at least one question type")
      .default(["mcq"]),
    mode: quizModeSchema,
  })
  .superRefine((val, ctx) => {
    if (val.mode === "board_paper" && val.questionCount < 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questionCount"],
        message: "Board papers need at least 15 questions",
      });
    }
  });

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;

export const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.string().max(2000),
    }),
  ),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;

export const selfMarkSchema = z.object({
  answerId: z.string().uuid(),
  correct: z.boolean(),
});

export type SelfMarkInput = z.infer<typeof selfMarkSchema>;
