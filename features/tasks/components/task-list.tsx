import type { Task } from "../types";
import { TaskRow } from "./task-row";

interface TaskListProps {
  tasks: Task[];
  showDelete?: boolean;
}

/**
 * Simple vertical stack of TaskRow items. No section headers — callers
 * (e.g. the tasks page filter tabs, the dashboard widget) already segment
 * by intent.
 */
export function TaskList({ tasks, showDelete = true }: TaskListProps) {
  if (tasks.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2.5">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} showDelete={showDelete} />
      ))}
    </ul>
  );
}
