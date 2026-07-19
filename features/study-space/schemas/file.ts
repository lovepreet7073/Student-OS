import { z } from "zod";

import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../lib/mime";

const uuid = z.string().uuid("Invalid identifier");

export const beginUploadSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "Missing file name")
    .max(255, "File name is too long"),
  mimeType: z
    .string()
    .refine(
      (m) => (ALLOWED_MIME_TYPES as readonly string[]).includes(m),
      "Only PDF and image files (PNG, JPG) are supported for now",
    ),
  sizeBytes: z
    .number()
    .int()
    .positive("File is empty")
    .max(MAX_FILE_SIZE_BYTES, "File exceeds the 25 MB limit"),
});
export type BeginUploadInput = z.infer<typeof beginUploadSchema>;

export const completeUploadSchema = z.object({
  fileId: uuid,
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  storagePath: z.string().min(1),
  subjectId: uuid,
  chapterId: uuid.nullable().optional(),
  description: z.string().max(500).optional(),
});
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;

export const listLibrarySchema = z.object({
  subjectId: uuid.optional(),
  chapterId: uuid.optional(),
  bookmarkedOnly: z.boolean().optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(60),
});
export type ListLibraryInput = z.infer<typeof listLibrarySchema>;
