import { z } from "zod";

export const geminiPlanSessionSchema = z.object({
  subject_name: z.string().trim().min(1),
  topic: z.string().trim().min(1).max(200),
  duration_minutes: z.number().int().min(5).max(240),
  notes: z.string().trim().default(""),
});

export const geminiPlanDaySchema = z.object({
  day_offset: z.number().int().min(0).max(60),
  sessions: z.array(geminiPlanSessionSchema).min(1).max(6),
});

export const geminiStudyPlanResponseSchema = z.object({
  days: z.array(geminiPlanDaySchema).min(1).max(60),
});

export type GeminiStudyPlanResponse = z.infer<typeof geminiStudyPlanResponseSchema>;
