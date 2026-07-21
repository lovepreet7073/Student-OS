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
  mimeType: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
  ]),
});
export type ChatAttachmentRef = z.infer<typeof chatAttachmentSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z
    .string()
    .trim()
    .max(4000, "Trim your message — keep it under 4000 characters"),
  attachments: z.array(chatAttachmentSchema).max(1).optional(),
  /**
   * `send` (default): insert a new user message row, then stream a reply.
   * `regenerate`: assume the trailing user message is already in the DB
   *   (e.g. after `editMessage` or `prepareRegenerate`); DON'T re-insert
   *   it — just stream a fresh assistant reply.
   */
  mode: z.enum(["send", "regenerate"]).default("send"),
})
  // Message text is optional when an image or PDF is attached — a
  // picture on its own is a valid ask ("what does this diagram mean?").
  // `regenerate` mode has no incoming user text at all (the persisted
  // last-user-message is what gets answered).
  .superRefine((val, ctx) => {
    if (val.mode === "regenerate") return;
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
