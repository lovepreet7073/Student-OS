export type ChatRole = "user" | "assistant";

export interface ChatAttachment {
  path: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  attachments: ChatAttachment[];
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  subjectId: string | null;
  subjectName: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationWithMessages extends ChatConversation {
  messages: ChatMessage[];
}

export interface ChatConversationListItem
  extends Pick<
    ChatConversation,
    "id" | "title" | "subjectId" | "subjectName" | "updatedAt"
  > {
  lastMessagePreview: string;
}
