import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listQuizzes } from "../actions/list-quizzes";
import { QuizEmptyState } from "./quiz-empty-state";
import { QuizHistoryList } from "./quiz-history-list";

/**
 * Body of the Quizzes tab in the Practice hub.
 * Fetches its own data (server component) so `/app/practice` doesn't
 * need to know which action feeds each tab.
 */
export async function QuizzesHubView() {
  const result = await listQuizzes();

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Quiz history">
        {!result.ok ? (
          <ErrorState
            title="Couldn't load your quizzes"
            description={result.error.message}
          />
        ) : result.data.length === 0 ? (
          <QuizEmptyState />
        ) : (
          <QuizHistoryList quizzes={result.data} />
        )}
      </section>

      <div className="lg:hidden">
        <Button asChild fullWidth variant="outline" size="lg">
          <Link href="/app/study/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            New quiz
          </Link>
        </Button>
      </div>
    </div>
  );
}
