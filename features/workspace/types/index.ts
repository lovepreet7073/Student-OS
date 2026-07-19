export type WorkspaceEntityType =
  | "note"
  | "file"
  | "task"
  | "quiz"
  | "study_plan"
  | "test_evaluation"
  | "community_note";

export type ActivityAction = "opened" | "uploaded" | "created";

export interface ActivityEvent {
  id: string;
  entityType: WorkspaceEntityType;
  entityId: string;
  action: ActivityAction;
  title: string;
  createdAt: string;
}

/** Counts + a preview of newest items across every workspace category. */
export interface WorkspaceOverview {
  notes: number;
  files: number;
  tasks: { total: number; openToday: number };
  bookmarkedNotes: number;
  quizzes: number;
  studyPlanActive: boolean;
  testEvaluations: number;
  sharedToCommunity: number;
}

export interface WorkspaceCategory {
  key: "notes" | "files" | "tasks" | "bookmarks" | "quizzes" | "plan" | "tests" | "community";
  labelKey: string;
  descriptionKey: string;
  href: string;
  count: number;
  tone: "primary" | "brand" | "info" | "success" | "warning" | "danger";
}
