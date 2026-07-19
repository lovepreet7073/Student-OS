import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function EvaluationEmptyState() {
  return (
    <EmptyState
      icon={Sparkles}
      title="No test evaluations yet"
      description="Uploaded a paper test? Snap the pages, add the topic, and get AI feedback with marks + a study plan for what to revise."
      action={
        <Button asChild>
          <Link href="/app/tests/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            Grade your first test
          </Link>
        </Button>
      }
    />
  );
}
