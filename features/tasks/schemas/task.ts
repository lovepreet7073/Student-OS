import { z } from "zod";

const uuid = z.string().uuid("Invalid identifier");

// Accepts YYYY-MM-DD (native <input type="date"> output) or empty string.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the task a title")
    .max(200, "Title is too long"),
  notes: z.string().max(5000, "Notes are too long").optional(),
  subjectId: uuid.nullable().optional(),
  dueDate: isoDate.nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.extend({
  id: uuid,
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const toggleTaskSchema = z.object({
  id: uuid,
  done: z.boolean(),
});
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;

export const taskFilterSchema = z
  .enum(["today", "upcoming", "backlog", "done", "all"])
  .default("today");
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;

export const listTasksSchema = z.object({
  filter: taskFilterSchema,
  subjectId: uuid.optional(),
  limit: z.number().int().min(1).max(200).default(100),
});
export type ListTasksInput = z.infer<typeof listTasksSchema>;
