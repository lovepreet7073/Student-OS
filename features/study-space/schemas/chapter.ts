import { z } from "zod";

const uuid = z.string().uuid("Invalid identifier");

export const createChapterSchema = z.object({
  subjectId: uuid,
  name: z
    .string()
    .trim()
    .min(1, "Give the chapter a name")
    .max(80, "Name is too long"),
});
export type CreateChapterInput = z.infer<typeof createChapterSchema>;

export const deleteChapterSchema = z.object({ id: uuid });
