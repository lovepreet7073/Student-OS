import { z } from "zod";

const uuid = z.string().uuid("Invalid identifier");

export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give your note a title")
    .max(200, "Title is too long"),
  content: z
    .string()
    .max(50_000, "Note is too long — split it into multiple notes"),
  subjectId: uuid,
  chapterId: uuid.optional().or(z.literal("").transform(() => undefined)),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.extend({
  id: uuid,
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const notesQuerySchema = z.object({
  subjectId: uuid.optional(),
  chapterId: uuid.optional(),
  bookmarkedOnly: z.boolean().optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type NotesQueryInput = z.infer<typeof notesQuerySchema>;
