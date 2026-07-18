export type TaskFilter = "today" | "upcoming" | "backlog" | "done" | "all";

export type Task = {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectId: string | null;
  subjectName: string | null;
  title: string;
  notes: string | null;
  dueDate: string | null;      // YYYY-MM-DD or null
  completedAt: string | null;  // ISO timestamptz or null
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TasksListResult = {
  items: Task[];
  total: number;
};
