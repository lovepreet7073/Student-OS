import { z } from "zod";

export const createExamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the exam a name")
    .max(120, "Keep the name under 120 characters"),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  subjectId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
});
export type CreateExamInput = z.infer<typeof createExamSchema>;
