import { z } from "zod";

const uuid = z.string().uuid("Invalid identifier");

export const examTypeSchema = z.enum([
  "unit_test",
  "chapter_test",
  "board_model",
  "practice",
  "other",
]);

export const beginEvaluationSchema = z.object({
  title: z.string().trim().min(1, "Give the test a title").max(200),
  subjectId: uuid,
  examType: examTypeSchema,
  maxMarks: z.coerce.number().int().min(1).max(500),
  topics: z.string().trim().max(1000).optional().default(""),
  pages: z
    .array(
      z.object({
        pageNumber: z.number().int().min(1).max(30),
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        sizeBytes: z.number().int().positive().max(26214400),
      }),
    )
    .min(1, "Upload at least one page")
    .max(15, "Up to 15 pages per test"),
});
export type BeginEvaluationInput = z.infer<typeof beginEvaluationSchema>;

export const submitForEvaluationSchema = z.object({ evaluationId: uuid });
export const deleteEvaluationSchema = z.object({ id: uuid });
