import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function QuizEmptyState() {
  return (
    <EmptyState
      icon={Sparkles}
      title="No quizzes yet"
      description="Type a topic and let AI generate a chapter-wise quiz personalised to your Board, Class and Medium."
      action={
        <Button asChild>
          <Link href="/app/study/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            Generate your first quiz
          </Link>
        </Button>
      }
    />
  );
}
