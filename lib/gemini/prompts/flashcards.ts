import type { StudentContext } from "../context";

export interface FlashcardsPromptInput {
  ctx: StudentContext;
  subjectName: string;
  topic: string;
  cardCount: number;
  /**
   * Optional source content — when set, the deck is generated from a note or
   * an uploaded passage rather than the topic string alone. Kept ≤ ~4000 chars
   * upstream so the prompt stays under the token budget.
   */
  sourceText?: string;
}

/**
 * Prompt for flashcard generation. Same design contract as the quiz prompt
 * (see `lib/gemini/prompts/quiz.ts`): pure template, all variability comes
 * through the input record, output is a JSON blob validated in the feature's
 * `schemas/gemini.ts`.
 *
 * The rules aim to prevent the two most common failure modes:
 *   1. Front is a topic name ("Photosynthesis") with a back that's an essay
 *   2. Both sides carry the same information ("What is a mitochondrion?" /
 *      "A mitochondrion.")
 *
 * We ask for atomic Q/A pairs — one fact per card — because flashcard recall
 * only works when the answer is a single, testable unit.
 */
export function buildFlashcardsPrompt(input: FlashcardsPromptInput): string {
  const { ctx, subjectName, topic, cardCount, sourceText } = input;

  const sourceBlock = sourceText
    ? [
        `Source material (extract cards ONLY from this content — do not add outside knowledge):`,
        `"""`,
        sourceText.slice(0, 4000),
        `"""`,
        ``,
      ]
    : [];

  return [
    `You are StudyOS, generating a set of study flashcards for a Class ${ctx.className} student on the ${ctx.boardName} (${ctx.boardShortName}) curriculum.`,
    `Subject: ${subjectName}.`,
    `Write every "front", "back", and "hint" in ${ctx.mediumName} (${ctx.mediumNativeName}). Match Class ${ctx.className}-level vocabulary and depth.`,
    ``,
    `Topic: "${topic}"`,
    ``,
    ...sourceBlock,
    `Generate exactly ${cardCount} flashcards. Rules:`,
    `- "front" is a SHORT prompt: a question, a term, or a fill-in-the-blank cue (≤ 12 words).`,
    `- "back" is the answer or definition (1–3 sentences, ≤ 60 words).`,
    `- Front and back must carry DIFFERENT information — never restate the front on the back.`,
    `- Each card tests exactly ONE fact. Split compound ideas into multiple cards.`,
    `- Vary the card style across the deck: definitions, cause/effect, examples, formulas, comparisons.`,
    `- "hint" is optional. Include it (≤ 8 words) when the answer is non-obvious; omit or set to null when the front is already clear.`,
    `- No markdown formatting inside strings.`,
    ``,
    `Return JSON matching this exact shape:`,
    `{`,
    `  "cards": [`,
    `    { "front": "string", "back": "string", "hint": "string | null" }`,
    `  ]`,
    `}`,
  ].join("\n");
}
