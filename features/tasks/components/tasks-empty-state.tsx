import { CheckSquare, Clock, Inbox, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

import type { TaskFilter } from "../types";

const EMPTIES: Record<TaskFilter, { icon: LucideIcon; title: string; description: string }> = {
  today: {
    icon: Sparkles,
    title: "Nothing on your plate today",
    description: "Add a task above, or take a break — you've earned it.",
  },
  upcoming: {
    icon: Clock,
    title: "Nothing scheduled ahead",
    description: "Give your future self a plan — add a task with a due date.",
  },
  backlog: {
    icon: Inbox,
    title: "Your backlog is empty",
    description: "Undated tasks land here. Great place for ideas that aren't urgent.",
  },
  done: {
    icon: CheckSquare,
    title: "Nothing completed yet",
    description: "Check off a task to celebrate small wins here.",
  },
  all: {
    icon: Sparkles,
    title: "No tasks yet",
    description: "Add your first task above to start building your daily plan.",
  },
};

export function TasksEmptyState({ filter }: { filter: TaskFilter }) {
  const props = EMPTIES[filter];
  return <EmptyState icon={props.icon} title={props.title} description={props.description} />;
}
