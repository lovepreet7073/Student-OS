import { z } from "zod";

export const geminiAnswerSchema = z.object({
  question_number: z.number().int().min(1).max(50),
  question_text: z.string().trim().default(""),
  student_answer: z.string().default(""),
  marks_awarded: z.number().min(0),
  max_marks: z.number().min(0),
  feedback: z.string().trim().default(""),
  missing_points: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
});

export const geminiTestEvaluationResponseSchema = z
  .object({
    overall_summary: z.string().trim().min(1),
    score: z.number().min(0),
    percentage: z.number().min(0).max(100),
    grade: z.enum(["A+", "A", "B+", "B", "C", "D", "F"]),
    answers: z.array(geminiAnswerSchema).min(1).max(50),
    recommended_topics: z.array(z.string()).default([]),
  })
  .superRefine((val, ctx) => {
    // marks_awarded must not exceed max_marks per answer
    val.answers.forEach((ans, i) => {
      if (ans.marks_awarded > ans.max_marks) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["answers", i, "marks_awarded"],
          message: "marks_awarded exceeds max_marks",
        });
      }
    });
  });

export type GeminiTestEvaluationResponse = z.infer<
  typeof geminiTestEvaluationResponseSchema
>;
