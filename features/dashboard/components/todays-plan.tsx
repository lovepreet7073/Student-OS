import Link from "next/link";
import { ArrowRight, ListTodo } from "lucide-react";

import { listTasks } from "@/features/tasks/actions/list-tasks";
import { TaskList } from "@/features/tasks/components/task-list";

/**
 * Dashboard widget: today's plan.
 *
 * Server component — fetches its own data via `listTasks({ filter: 'today' })`,
 * showing up to 5 items. Users tap "See all" to reach the full `/app/tasks`
 * page for filtering, quick-add, and management.
 *
 * On failure (rare — RLS guarded, scoped to logged-in user) the widget renders
 * nothing rather than displaying an error — the dashboard shouldn't be broken
 * by a soft failure in one card.
 */
export async function TodaysPlan() {
  const result = await listTasks({ filter: "today", limit: 5 });
  if (!result.ok) return null;

  const tasks = result.data.items;
  const remaining = tasks.filter((t) => !t.completedAt).length;
  const hasAny = tasks.length > 0;

  return (
    <section aria-label="Today's plan" className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">Today&rsquo;s plan</h2>
        {hasAny ? (
          <Link
            href="/app/tasks"
            className="text-[13px] font-bold text-primary hover:underline"
          >
            {remaining} left
          </Link>
        ) : null}
      </div>

      {hasAny ? (
        <>
          <TaskList tasks={tasks} showDelete={false} />
          <Link
            href="/app/tasks"
            className="inline-flex items-center justify-center gap-1 self-end text-[13px] font-bold text-primary hover:underline"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          </Link>
        </>
      ) : (
        <Link
          href="/app/tasks"
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-5 py-8 text-center transition-colors hover:border-primary/40"
        >
          <ListTodo className="h-6 w-6 text-muted-foreground" strokeWidth={1.8} aria-hidden />
          <div>
            <div className="text-[15px] font-bold">Nothing planned for today</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              Tap to add your first task
            </div>
          </div>
        </Link>
      )}
    </section>
  );
}
