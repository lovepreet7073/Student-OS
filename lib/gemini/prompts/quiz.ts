import type { StudentContext } from "../context";

export type QuizQuestionType =
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "short_answer";

export interface QuizPromptInput {
  ctx: StudentContext;
  subjectName: string;   // scoped subject (may differ from active subjects)
  topic: string;
  questionCount: number;
  questionTypes: readonly QuizQuestionType[];
}

/**
 * Pure prompt template — no side effects, no fetches. All prompt versions
 * for AI features live under `lib/gemini/prompts/` so we can review changes
 * as small, focused PRs and pin `prompt_version` per generation later.
 */
export function buildQuizPrompt(input: QuizPromptInput): string {
  const {
    ctx,
    subjectName,
    topic,
    questionCount,
    questionTypes,
  } = input;

  const typesList = questionTypes.join(", ");

  return [
    `You are StudyOS, an AI quiz generator for a Class ${ctx.className} student on the ${ctx.boardName} (${ctx.boardShortName}) curriculum.`,
    `Subject: ${subjectName}.`,
    `The student's study medium is ${ctx.mediumName} (${ctx.mediumNativeName}). Generate every question, option, correct answer, and explanation in ${ctx.mediumName}. Match Class ${ctx.className}-level vocabulary and depth.`,
    ``,
    `Topic to quiz on: "${topic}"`,
    ``,
    `Generate ${questionCount} questions. Allowed types: ${typesList}. Distribute types roughly evenly.`,
    ``,
    `Rules:`,
    `- Type "mcq":         "options" is an array of exactly 4 distinct strings; "correct_answer" must exactly equal one of them.`,
    `- Type "true_false":  "options" is an empty array []; "correct_answer" must be exactly the string "true" or "false".`,
    `- Type "fill_blank":  "options" is an empty array []; "correct_answer" is a single word or short phrase (≤ 6 words).`,
    `- Type "short_answer":"options" is an empty array []; "correct_answer" is a reference answer of 1–3 sentences.`,
    `- "explanation" is 1–2 sentences on why the answer is correct — for students, not for graders.`,
    `- Every field is non-empty. Do not include markdown formatting inside strings.`,
    ``,
    `Return JSON matching this exact shape:`,
    `{`,
    `  "questions": [`,
    `    {`,
    `      "type": "mcq" | "true_false" | "fill_blank" | "short_answer",`,
    `      "question": "string",`,
    `      "options": ["string", ...],`,
    `      "correct_answer": "string",`,
    `      "explanation": "string"`,
    `    }`,
    `  ]`,
    `}`,
  ].join("\n");
}
