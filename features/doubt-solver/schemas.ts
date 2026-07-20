import { z } from "zod";

export const askDoubtSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Ask a real question")
    .max(4000, "Trim your question — keep it under 4000 characters"),
  subjectId: z.string().uuid().optional(),
});
export type AskDoubtInput = z.infer<typeof askDoubtSchema>;
