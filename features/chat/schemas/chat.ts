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

export const chatAttachmentSchema = z.object({
  path: z.string().min(1),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});
export type ChatAttachmentRef = z.infer<typeof chatAttachmentSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .max(4000, "Trim your message — keep it under 4000 characters"),
  attachments: z.array(chatAttachmentSchema).max(1).optional(),
})
  // Message text is optional when an image is attached — a picture on its
  // own is a valid ask ("what does this diagram mean?") — but at least one
  // of the two must be present.
  .superRefine((val, ctx) => {
    if (
      val.message.trim().length === 0 &&
      (!val.attachments || val.attachments.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["message"],
        message: "Type something or attach an image",
      });
    }
  });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const deleteConversationSchema = z.object({
  conversationId: z.string().uuid(),
});
export type DeleteConversationInput = z.infer<typeof deleteConversationSchema>;
