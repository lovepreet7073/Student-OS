import { getMyProfile } from "@/features/academic-identity/actions/get-my-profile";
import type { AcademicProfile } from "@/features/academic-identity/types";

/**
 * A student's context, distilled for injection into Gemini prompts.
 * Uses human-readable names — never raw UUIDs.
 */
export type StudentContext = {
  boardName: string;         // "Punjab School Education Board"
  boardShortName: string;    // "PSEB"
  boardSlug: string;         // "pseb"
  className: string;         // "10"
  mediumName: string;        // "Punjabi"
  mediumSlug: string;        // "punjabi"
  mediumLocale: string;      // "pa"
  mediumNativeName: string;  // "ਪੰਜਾਬੀ"
  subjectNames: string[];    // ["Mathematics", "Science", ...]
  uiLocale: string;          // "en" — separate from mediumLocale
};

export async function getStudentContext(): Promise<StudentContext | null> {
  const profile = await getMyProfile();
  if (!profile) return null;
  return toStudentContext(profile);
}

export function toStudentContext(profile: AcademicProfile): StudentContext {
  return {
    boardName: profile.board.name,
    boardShortName: profile.board.shortName,
    boardSlug: profile.board.slug,
    className: profile.classLevel.name,
    mediumName: profile.medium.name,
    mediumSlug: profile.medium.slug,
    mediumLocale: profile.medium.locale,
    mediumNativeName: profile.medium.nativeName ?? profile.medium.name,
    subjectNames: profile.subjects.map((s) => s.name),
    uiLocale: profile.preferredLanguage,
  };
}

/**
 * Composes the standard StudyOS system prompt for a Gemini call.
 * Every AI feature (Chat, Summary, Quiz, Flashcards, Doubt Solver) should call
 * this so the model always answers in the correct medium/curriculum/level.
 */
export function buildStudySystemPrompt(ctx: StudentContext, task: string): string {
  const subjects = ctx.subjectNames.length > 0 ? ctx.subjectNames.join(", ") : "general";
  return [
    `You are StudyOS, an AI study companion for a Class ${ctx.className} student on the ${ctx.boardName} (${ctx.boardShortName}) curriculum.`,
    `The student's study medium is ${ctx.mediumName} (${ctx.mediumNativeName}). Answer in ${ctx.mediumName}. Do not translate technical terms unless helpful.`,
    `The student's active subjects: ${subjects}.`,
    `Match the depth and vocabulary to Class ${ctx.className} level. Reference syllabus-appropriate examples. Be concise, encouraging, and accurate.`,
    ``,
    `Task: ${task}`,
  ].join("\n");
}
