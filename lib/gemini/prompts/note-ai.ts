import type { AcademicProfile } from "@/features/academic-identity/types";

export type NoteAiAction = "summarize" | "explain-simpler" | "key-points";

const INTENT: Record<NoteAiAction, string> = {
  summarize:
    "Summarise this note in 5-8 short bullet points. Preserve every factual claim; drop only filler and repetition.",
  "explain-simpler":
    "Rewrite this note in plain, everyday language a Class 8 student would understand. Replace jargon with simple words and short sentences. Keep every fact.",
  "key-points":
    "Extract the most important facts, formulas, definitions and dates as a bulleted list. One item per line. Sort by importance.",
};

/**
 * Prompt template for one-shot AI actions on a saved note.
 * Free-form Markdown output — the client renders it in a dialog. Same
 * pattern as the doubt-solver (Module 18).
 */
export function buildNoteAiPrompt({
  profile,
  subjectName,
  noteTitle,
  noteContent,
  action,
}: {
  profile: AcademicProfile;
  subjectName: string;
  noteTitle: string;
  noteContent: string;
  action: NoteAiAction;
}): string {
  return `You are a study assistant helping a Class ${profile.classLevel.name} student (${profile.board.shortName} board, ${profile.medium.name} medium).

Subject: ${subjectName}
Note title: ${noteTitle}

Note content:
"""
${noteContent}
"""

Task: ${INTENT[action]}

Rules:
- Answer in ${profile.medium.name} (match the note's language if it differs).
- Do NOT invent facts. If the note is empty or gibberish, say so briefly.
- Use clean Markdown: **bold** for terms, \`code\` for numbers/formulas, - for bullets.
- Keep it tight. No preamble, no "Here's the summary:", jump straight to the content.`;
}
