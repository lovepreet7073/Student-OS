export interface TeacherStats {
  approvedTotal: number;
  rejectedTotal: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
  pendingInScope: number;
  reportsOpen: number;
}

export interface TeacherModerationActivity {
  id: string;
  noteTitle: string;
  authorDisplayName: string;
  subjectName: string;
  status: "approved" | "rejected";
  moderatedAt: string;
}

export interface TopContributor {
  authorId: string;
  displayName: string;
  approvedCount: number;
}

export interface TeacherAnalyticsOverview {
  stats: TeacherStats;
  recentActivity: TeacherModerationActivity[];
  topContributors: TopContributor[];
}
