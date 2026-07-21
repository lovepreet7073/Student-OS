import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { getConversation } from "@/features/chat/actions/get-conversation";
import { ChatView } from "@/features/chat/components/chat-view";

export const metadata: Metadata = { title: "AI Chat" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const [result, profile] = await Promise.all([
    getConversation(id),
    getMyProfile(),
  ]);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }
  return <ChatView conversation={result.data} subjects={profile?.subjects ?? []} />;
}
