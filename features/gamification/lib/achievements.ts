import type { StreakStats } from "@/features/dashboard/actions/get-streak-stats";
import type { WorkspaceOverview } from "@/features/workspace/types";

export type BadgeCategory =
  | "streak"
  | "notes"
  | "quizzes"
  | "files"
  | "tests"
  | "community"
  | "tasks";

export interface Badge {
  key: string;
  category: BadgeCategory;
  label: string;
  description: string;
  /** The metric value the badge measures against (e.g. current streak length). */
  metric: number;
  /** Value required for the badge to be earned. */
  threshold: number;
  earned: boolean;
  /** Percentage 0-100 towards the next tier. Only meaningful when !earned. */
  progress: number;
}

/**
 * Computes the caller's earned + upcoming badges from workspace counts and
 * streak stats. Pure — no DB, no cache — cheap to call anywhere the two
 * inputs are already available.
 *
 * Each category has 2-4 tiers. Ordering within a category is smallest
 * threshold first; the UI can show earned tiers filled and next tier as
 * a progress ring.
 */
export function computeAchievements(
  overview: WorkspaceOverview,
  streak: StreakStats,
): Badge[] {
  const b = (
    key: string,
    category: BadgeCategory,
    label: string,
    description: string,
    metric: number,
    threshold: number,
  ): Badge => ({
    key,
    category,
    label,
    description,
    metric,
    threshold,
    earned: metric >= threshold,
    progress: Math.min(100, Math.round((metric / threshold) * 100)),
  });

  const streakBest = Math.max(streak.current, streak.longest);

  return [
    // ---- Streak ----
    b("streak_3", "streak", "Warm-up", "3-day study streak", streakBest, 3),
    b("streak_7", "streak", "On fire", "7-day study streak", streakBest, 7),
    b("streak_14", "streak", "Consistent", "14-day study streak", streakBest, 14),
    b("streak_30", "streak", "Unstoppable", "30-day study streak", streakBest, 30),

    // ---- Notes ----
    b("notes_1", "notes", "First jotter", "Created your first note", overview.notes, 1),
    b("notes_10", "notes", "Note-taker", "10 notes written", overview.notes, 10),
    b("notes_50", "notes", "Scribe", "50 notes written", overview.notes, 50),

    // ---- Quizzes ----
    b("quiz_1", "quizzes", "Quiz starter", "First AI quiz", overview.quizzes, 1),
    b("quiz_10", "quizzes", "Quiz addict", "10 quizzes generated", overview.quizzes, 10),
    b("quiz_50", "quizzes", "Master quizzer", "50 quizzes generated", overview.quizzes, 50),

    // ---- Files ----
    b("files_5", "files", "Library builder", "5 files in your Study Space", overview.files, 5),
    b("files_25", "files", "Archivist", "25 files uploaded", overview.files, 25),

    // ---- Tests ----
    b(
      "tests_1",
      "tests",
      "First evaluation",
      "Submitted your first test for AI marking",
      overview.testEvaluations,
      1,
    ),
    b(
      "tests_5",
      "tests",
      "Sharp critic",
      "5 tests evaluated by AI",
      overview.testEvaluations,
      5,
    ),

    // ---- Community ----
    b(
      "community_1",
      "community",
      "Contributor",
      "Shared your first note with peers",
      overview.sharedToCommunity,
      1,
    ),
    b(
      "community_5",
      "community",
      "Team player",
      "5 notes shared to community",
      overview.sharedToCommunity,
      5,
    ),

    // ---- Tasks ----
    b("tasks_5", "tasks", "Planner", "Created 5 tasks", overview.tasks.total, 5),
  ];
}

/** How many badges the caller has earned. */
export function earnedCount(badges: Badge[]): number {
  return badges.filter((b) => b.earned).length;
}
