export type StudyPlan = {
  id: string;
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  title: string;
  goal: string | null;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD (inclusive)
  dailyHours: number;
  focusSubjectIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudyPlanItem = {
  id: string;
  planId: string;
  userId: string;
  planDate: string;      // YYYY-MM-DD
  ordinal: number;
  subjectId: string | null;
  subjectName: string;
  topic: string;
  durationMinutes: number;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type StudyPlanWithItems = StudyPlan & {
  items: StudyPlanItem[];
};

/** Convenience shape used by the dashboard widget. */
export type StudyPlanListItem = Pick<
  StudyPlan,
  "id" | "title" | "startDate" | "endDate" | "dailyHours" | "isActive" | "createdAt"
> & {
  totalItems: number;
  completedItems: number;
};
