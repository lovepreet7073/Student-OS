import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid identifier");

export const savePreferencesSchema = z.object({
  boardId: uuidSchema,
  mediumId: uuidSchema,
  classId: uuidSchema,
  subjectIds: z
    .array(uuidSchema)
    .min(1, "Select at least one subject")
    .max(20, "Select up to 20 subjects"),
  preferredLanguage: z
    .string()
    .trim()
    .min(2, "Choose a language")
    .max(8, "Language code is too long"),
});

export type SavePreferencesInput = z.infer<typeof savePreferencesSchema>;

/**
 * Validates just the (board, class, medium) triple used to fetch scoped
 * subjects during onboarding.
 */
export const subjectScopeSchema = z.object({
  boardId: uuidSchema,
  classId: uuidSchema,
  mediumId: uuidSchema,
});

export type SubjectScopeInput = z.infer<typeof subjectScopeSchema>;
