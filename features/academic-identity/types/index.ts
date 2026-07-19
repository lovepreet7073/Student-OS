/**
 * Domain types for the Academic Identity System.
 * Kept independent of `types/database.ts` so features consume clean shapes
 * without leaking Supabase column casing.
 */

export type Board = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  sortOrder: number;
};

export type Medium = {
  id: string;
  name: string;
  slug: string;
  nativeName: string | null;
  locale: string;
  sortOrder: number;
};

export type ClassLevel = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Subject = {
  id: string;
  boardId: string;
  classId: string;
  mediumId: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type ReferenceData = {
  boards: Board[];
  mediums: Medium[];
  classes: ClassLevel[];
};

export type UserRole = "student" | "teacher";

/**
 * The user's saved preferences plus their subject selections.
 * Returned by `getMyProfile`. Contains everything needed to filter content.
 */
export type AcademicProfile = {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  board: Board;
  medium: Medium;
  classLevel: ClassLevel;
  subjects: Subject[];
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * The minimum shape needed to filter DB queries by the user's academic scope.
 * Every future feature (Notes, Papers, Quiz, etc.) will consume this.
 */
export type AcademicScope = {
  userId: string;
  boardId: string;
  classId: string;
  mediumId: string;
  subjectIds: string[];
};

export type SavableProfile = {
  boardId: string;
  mediumId: string;
  classId: string;
  subjectIds: string[];
  preferredLanguage: string;
  role?: UserRole;
};
