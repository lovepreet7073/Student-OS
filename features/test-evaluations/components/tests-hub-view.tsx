import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { listEvaluations } from "../actions/list-evaluations";
import { EvaluationEmptyState } from "./evaluation-empty-state";
import { EvaluationHistoryList } from "./evaluation-history-list";

/**
 * Body of the Test Evals tab in the Practice hub. Fetches its own
 * data so the hub page doesn't need per-tab knowledge.
 */
export async function TestsHubView() {
  const result = await listEvaluations();

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Evaluation history">
        {!result.ok ? (
          <ErrorState
            title="Couldn't load evaluations"
            description={result.error.message}
          />
        ) : result.data.length === 0 ? (
          <EvaluationEmptyState />
        ) : (
          <EvaluationHistoryList items={result.data} />
        )}
      </section>

      <div className="lg:hidden">
        <Button asChild fullWidth variant="outline" size="lg">
          <Link href="/app/tests/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            Grade a test
          </Link>
        </Button>
      </div>
    </div>
  );
}
