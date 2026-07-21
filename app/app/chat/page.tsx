import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listConversations } from "@/features/chat/actions/list-conversations";
import { ChatEmptyState } from "@/features/chat/components/chat-empty-state";
import { ChatList } from "@/features/chat/components/chat-list";

export const metadata: Metadata = { title: "AI Chat" };

export default async function ChatIndexPage() {
  const result = await listConversations();

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">
              AI Chat
            </h1>
            <p className="mt-0.5 text-[13.5px] text-muted-foreground">
              Multi-turn conversations with a syllabus-aware tutor.
            </p>
          </div>
          <Button asChild size="icon" aria-label="New chat" className="lg:hidden">
            <Link href="/app/chat/new">
              <Sparkles className="h-[18px] w-[18px]" aria-hidden />
            </Link>
          </Button>
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/app/chat/new">
              <Sparkles className="h-4 w-4" aria-hidden />
              New chat
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Chat history" className="pt-5">
        {!result.ok ? (
          <ErrorState title="Couldn't load your chats" description={result.error.message} />
        ) : result.data.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <ChatList conversations={result.data} />
        )}
      </section>
    </div>
  );
}
