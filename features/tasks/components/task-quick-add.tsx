"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Subject } from "@/features/academic-identity/types";
import { cn } from "@/lib/utils";

import { createTask } from "../actions/create-task";
import { todayIsoDate } from "../lib/dates";

interface TaskQuickAddProps {
  subjects: Subject[];
  defaultDueDate?: "today" | "none";
}

/**
 * Inline quick-add row. Expands to show subject + date selectors on focus.
 * Submitting collapses back — no modal, no page navigation. Optimised for
 * "capture, don't fiddle" flow.
 */
export function TaskQuickAdd({ subjects, defaultDueDate = "today" }: TaskQuickAddProps) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(defaultDueDate === "today" ? todayIsoDate() : "");
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createTask({
        title: trimmed,
        subjectId: subjectId || null,
        dueDate: dueDate || null,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setTitle("");
      setExpanded(false);
      inputRef.current?.focus();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "rounded-lg border border-border bg-card transition-colors",
        expanded && "border-primary/50",
      )}
      aria-label="Quick add task"
    >
      <div className="flex items-center gap-2 p-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Add a task…"
          enterKeyHint="done"
          disabled={pending}
          className="border-none shadow-none focus-visible:ring-0"
          aria-label="Task title"
        />
        {title.trim() && !expanded ? (
          <Button type="submit" size="sm" loading={pending}>
            Add
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <div className="flex flex-col gap-2.5 border-t border-border px-2.5 pb-2.5 pt-3 sm:flex-row sm:items-center">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="flex h-11 flex-1 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9 sm:text-sm"
            aria-label="Subject"
          >
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex h-11 flex-1 rounded-md border border-input bg-transparent px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-9 sm:text-sm"
            aria-label="Due date"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setExpanded(false);
                setTitle("");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              Add task
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
