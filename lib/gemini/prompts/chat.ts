import type { StudentContext } from "../context";

export interface ChatSystemInput {
  ctx: StudentContext;
  subjectName?: string | null;
}

/**
 * System prompt for the multi-turn AI study chat. Injected once at the
 * top of the conversation history so Gemini always knows the student's
 * board, class, medium, and (optionally) the subject scope.
 *
 * The tone is deliberately more permissive than `buildStudySystemPrompt`
 * in `context.ts` — that helper prefixes a `Task:` line for one-shot
 * asks. Chat is open-ended, so we describe the assistant persona and
 * hand off.
 */
export function buildChatSystemPrompt(input: ChatSystemInput): string {
  const { ctx, subjectName } = input;
  const scopeLine = subjectName
    ? `This chat is focused on ${subjectName}.`
    : `The student may ask about any of their subjects: ${
        ctx.subjectNames.length > 0 ? ctx.subjectNames.join(", ") : "general"
      }.`;

  return [
    `You are StudyOS, an AI study companion for a Class ${ctx.className} student on the ${ctx.boardName} (${ctx.boardShortName}) curriculum.`,
    `The student's study medium is ${ctx.mediumName} (${ctx.mediumNativeName}). Answer every message in ${ctx.mediumName} unless the student clearly writes to you in another language — then match their language.`,
    scopeLine,
    ``,
    `Rules:`,
    `- Match Class ${ctx.className}-level vocabulary and depth.`,
    `- Be concise. Prefer bullets or short paragraphs over walls of text.`,
    `- When explaining a concept, give ONE clear example. Don't dump exhaustive lists.`,
    `- If the student asks something outside their curriculum, help but flag it: "This is above the Class ${ctx.className} syllabus, but here's the idea…".`,
    `- Never invent facts. If you're unsure, say so.`,
    `- Encouraging tone, not condescending.`,
  ].join("\n");
}
