import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid identifier");

export const shareNoteSchema = z.object({
  noteId: uuidSchema,
});
export type ShareNoteInput = z.infer<typeof shareNoteSchema>;

export const moderateNoteSchema = z
  .object({
    id: uuidSchema,
    action: z.enum(["approve", "reject"]),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === "reject" && (!val.reason || val.reason.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Give at least a short reason so the author can learn from it.",
      });
    }
  });
export type ModerateNoteInput = z.infer<typeof moderateNoteSchema>;

export const reportNoteSchema = z.object({
  id: uuidSchema,
  reason: z
    .string()
    .trim()
    .min(3, "Tell us briefly what's wrong")
    .max(500, "Keep it under 500 characters"),
});
export type ReportNoteInput = z.infer<typeof reportNoteSchema>;
