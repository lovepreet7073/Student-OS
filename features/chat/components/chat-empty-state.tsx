import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export function ChatEmptyState() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No chats yet"
      description="Ask the AI anything about your syllabus — a concept you're stuck on, a homework hint, or a quick summary."
    />
  );
}
