import { z } from "zod";

export const createConversationSchema = z.object({
  firstMessage: z
    .string()
    .trim()
    .min(2, "Type something to start")
    .max(4000, "Trim your message — keep it under 4000 characters"),
  subjectId: z.string().uuid().optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .min(1)
    .max(4000, "Trim your message — keep it under 4000 characters"),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const deleteConversationSchema = z.object({
  conversationId: z.string().uuid(),
});
export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;
