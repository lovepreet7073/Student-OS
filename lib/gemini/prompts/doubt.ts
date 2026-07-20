import type { AcademicProfile } from "@/features/academic-identity/types";

/**
 * Doubt-solver prompt.
 *
 * We don't ask for JSON — the answer is free-form Markdown-ish text so the
 * client can render it as a formatted response. This keeps the pipeline simple
 * and lets Gemini pick the best structure per question (a formula derivation
 * needs different layout from an English essay explanation).
 */
export function buildDoubtPrompt({
  profile,
  subjectName,
  question,
}: {
  profile: AcademicProfile;
  subjectName: string | null;
  question: string;
}): string {
  const context = [
    `Student profile: Class ${profile.classLevel.name}, ${profile.board.shortName} board, ${profile.medium.name} medium.`,
    subjectName ? `Subject: ${subjectName}.` : null,
    `Answer in ${profile.medium.name} (unless the question is in a different language — then match).`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a patient tutor helping a Class ${profile.classLevel.name} student.

${context}

The student asks:
"""
${question}
"""

Instructions:
1. Give a step-by-step explanation, not just the final answer.
2. Break down each step so a beginner can follow.
3. Use simple language — imagine explaining to a friend, not a professor.
4. If the question has a numerical or formula answer, show the working.
5. If the question is vague or unanswerable, ask a clarifying question instead of guessing.
6. Do NOT invent facts. If you're not sure, say so.
7. End with a one-line "Key takeaway".

Format your answer in clean Markdown:
- Use **bold** for important terms.
- Use \`code\` for formulas and numbers.
- Use numbered steps for the working.
- Keep paragraphs short.`;
}
