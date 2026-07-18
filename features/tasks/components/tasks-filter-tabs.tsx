"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { cn } from "@/lib/utils";

import type { TaskFilter } from "../types";

interface TasksFilterTabsProps {
  active: TaskFilter;
}

const TABS: { key: TaskFilter; label: string }[] = [
  { key: "today",    label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "backlog",  label: "Backlog" },
  { key: "done",     label: "Done" },
];

export function TasksFilterTabs({ active }: TasksFilterTabsProps) {
  const router = useRouter();
  const params = useSearchParams();

  const setFilter = useCallback(
    (filter: TaskFilter) => {
      const next = new URLSearchParams(params);
      if (filter === "today") next.delete("filter");
      else next.set("filter", filter);
      const qs = next.toString();
      router.replace(qs ? `/app/tasks?${qs}` : "/app/tasks", { scroll: false });
    },
    [params, router],
  );

  return (
    <div
      role="tablist"
      aria-label="Filter tasks"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "inline-flex h-10 flex-shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
