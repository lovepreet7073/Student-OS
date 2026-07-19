import Link from "next/link";
import { CalendarRange, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function PlanEmptyState() {
  return (
    <EmptyState
      icon={CalendarRange}
      title="No study plan yet"
      description="Tell the AI your goals, exam window, and hours per day. It will generate a personalized day-by-day plan."
      action={
        <Button asChild>
          <Link href="/app/planner/new">
            <Sparkles className="h-4 w-4" aria-hidden />
            Create your first plan
          </Link>
        </Button>
      }
    />
  );
}
