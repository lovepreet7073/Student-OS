import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import { listTasks } from "@/features/tasks/actions/list-tasks";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskQuickAdd } from "@/features/tasks/components/task-quick-add";
import { TasksEmptyState } from "@/features/tasks/components/tasks-empty-state";
import { TasksFilterTabs } from "@/features/tasks/components/tasks-filter-tabs";
import { taskFilterSchema } from "@/features/tasks/schemas/task";

export const metadata: Metadata = { title: "Tasks" };

interface TasksPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  // Defensive parse: users can type any string into the URL — fall back to
  // "today" rather than 500'ing.
  const parsedFilter = taskFilterSchema.safeParse(params.filter);
  const filter = parsedFilter.success ? parsedFilter.data : "today";

  const [profile, tasksResult] = await Promise.all([
    getMyProfile(),
    listTasks({ filter }),
  ]);

  if (!profile) return null;
  if (!tasksResult.ok) {
    return (
      <div className="mx-auto max-w-[780px] px-5 py-8 sm:px-7 lg:max-w-[1140px] lg:px-11">
        <ErrorState title="Couldn't load tasks" description={tasksResult.error.message} />
      </div>
    );
  }

  const tasks = tasksResult.data.items;

  return (
    <div className="mx-auto max-w-[780px] px-5 pb-10 sm:px-7 lg:max-w-[1140px] lg:px-11">
      <header className="sticky top-0 z-10 -mx-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-7 lg:-mx-11">
        <div className="mx-auto flex max-w-[780px] flex-col gap-3.5 px-5 pb-3.5 pt-4 sm:px-7 sm:pt-5 lg:max-w-[1140px] lg:px-11 lg:pt-6">
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[30px]">Tasks</h1>
          <Suspense fallback={<TabsSkeleton />}>
            <TasksFilterTabs active={filter} />
          </Suspense>
        </div>
      </header>

      <div className="flex flex-col gap-4 pt-5">
        <TaskQuickAdd
          subjects={profile.subjects}
          defaultDueDate={filter === "upcoming" ? "none" : "today"}
        />

        {tasks.length === 0 ? (
          <TasksEmptyState filter={filter} />
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      <Skeleton className="h-10 w-16" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-16" />
    </div>
  );
}
