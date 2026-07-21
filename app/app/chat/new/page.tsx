import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { NewChatForm } from "@/features/chat/components/new-chat-form";

export const metadata: Metadata = { title: "New chat" };

export default async function NewChatPage() {
  const profile = await getMyProfile();
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 pt-4 sm:px-7 sm:pt-6 lg:px-11 lg:pt-8">
      <nav aria-label="Back to chats" className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Back">
          <Link href="/app/chat">
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
          </Link>
        </Button>
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          New chat
        </h1>
      </nav>

      <NewChatForm subjects={profile.subjects} />
    </div>
  );
}
