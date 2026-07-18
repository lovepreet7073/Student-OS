"use client";

import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { deleteTask } from "../actions/delete-task";
import { toggleTask } from "../actions/toggle-task";
import { formatDueDate, isOverdue } from "../lib/dates";
import type { Task } from "../types";

interface TaskRowProps {
  task: Task;
  showDelete?: boolean;
}

export function TaskRow({ task, showDelete = true }: TaskRowProps) {
  const [togglePending, startToggleTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const done = Boolean(task.completedAt);

  const handleToggle = () => {
    startToggleTransition(async () => {
      const result = await toggleTask({ id: task.id, done: !done });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteTask({ id: task.id });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  const overdue = !done && isOverdue(task.dueDate);
  const meta = [formatDueDate(task.dueDate), task.subjectName].filter(Boolean).join(" · ");

  return (
    <li
      className={cn(
        "flex min-h-[52px] items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 transition-opacity",
        (togglePending || deletePending) && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={togglePending}
        aria-pressed={done}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={cn(
          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          done
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border hover:border-primary/60",
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "text-[15px] font-bold leading-tight tracking-tight",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
        {meta ? (
          <span
            className={cn(
              "mt-0.5 text-xs font-semibold",
              overdue ? "text-danger" : "text-muted-foreground/80",
            )}
          >
            {meta}
          </span>
        ) : null}
      </div>

      {showDelete ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deletePending}
          aria-label="Delete task"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </li>
  );
}
