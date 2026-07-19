import { z } from "zod";

const uuid = z.string().uuid("Invalid identifier");
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const generatePlanSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Give the plan a title")
      .max(120, "Title is too long"),
    goal: z.string().trim().max(500).optional().default(""),
    startDate: isoDate,
    endDate: isoDate,
    dailyHours: z.coerce.number().int().min(1).max(10),
    focusSubjectIds: z.array(uuid).min(1, "Pick at least one subject").max(10),
  })
  .superRefine((val, ctx) => {
    if (val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }
    const days = Math.round(
      (Date.parse(val.endDate) - Date.parse(val.startDate)) / 86_400_000,
    );
    if (days > 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Plan window can't exceed 60 days",
      });
    }
  });

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

export const completeItemSchema = z.object({
  itemId: uuid,
  done: z.boolean(),
});
export type CompleteItemInput = z.infer<typeof completeItemSchema>;

export const setActivePlanSchema = z.object({ planId: uuid });
