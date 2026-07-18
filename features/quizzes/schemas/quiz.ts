import { z } from "zod";

const questionTypeSchema = z.enum([
  "mcq",
  "true_false",
  "fill_blank",
  "short_answer",
]);

export const generateQuizSchema = z.object({
  subjectId: z.string().uuid("Choose a subject"),
  topic: z
    .string()
    .trim()
    .min(2, "Enter a topic")
    .max(200, "Topic is too long"),
  questionCount: z.coerce.number().int().min(3).max(20).default(10),
  questionTypes: z
    .array(questionTypeSchema)
    .min(1, "Pick at least one question type")
    .default(["mcq"]),
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
