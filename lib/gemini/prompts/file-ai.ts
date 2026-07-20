import type { AcademicProfile } from "@/features/academic-identity/types";

export type FileAiAction = "summarize" | "key-points" | "explain-simpler";

const INTENT: Record<FileAiAction, string> = {
  summarize:
    "Summarise the document in 6-10 short bullet points. Cover the whole document — beginning to end — not just the first page. Preserve every factual claim; drop only filler and repetition.",
  "key-points":
    "Extract the most important facts, formulas, definitions and dates from the document. One bullet per line. Sort by importance. Group by chapter / heading if the document has them.",
  "explain-simpler":
    "Rewrite the document's main ideas in plain, everyday language a Class 8 student would understand. Replace jargon with simple words and short sentences. Keep every fact.",
};

/**
 * Prompt template for AI actions run against an uploaded PDF or image in the
 * Study Space library. Gemini 1.5 Flash accepts inline base64 for PDFs and
 * images — the caller must base64 the file bytes and pass them via
 * `generateContent` inlineData. This template only produces the text prompt.
 *
 * Output is free-form Markdown — the client renders it in a modal, no schema.
 */
export function buildFileAiPrompt({
  profile,
  subjectName,
  fileName,
  action,
}: {
  profile: AcademicProfile;
  subjectName: string;
  fileName: string;
  action: FileAiAction;
}): string {
  return `You are a study assistant helping a Class ${profile.classLevel.name} student (${profile.board.shortName} board, ${profile.medium.name} medium).

Subject: ${subjectName}
Uploaded document: ${fileName}

Task: ${INTENT[action]}

Rules:
- Read the ENTIRE document that is attached — not just the first page.
- Answer in ${profile.medium.name} (match the document's language if it differs).
- Do NOT invent facts. If the document is blank, hand-drawn without legible text, or unrelated to studies, say so briefly and stop.
- Use clean Markdown: **bold** for terms, \`code\` for numbers/formulas, - for bullets. Use ## for section headings only if the document has them.
- Keep it tight. No preamble, no "Here's the summary:", jump straight to the content.`;
}
