import { z } from "zod";

import { getGeminiModel, type GeminiModelName } from "./client";

interface GenerateStructuredOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  model?: GeminiModelName;
  /** Max retries on parse or validation failure. Defaults to 1. */
  maxRetries?: number;
}

export interface StructuredResult<T> {
  data: T;
  rawResponse: string;
  attempts: number;
}

export class AIStructuredError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastRaw?: string,
  ) {
    super(message);
    this.name = "AIStructuredError";
  }
}

/**
 * The reusable AI pattern for the whole app.
 *
 * Every AI feature (Quiz, Study Planner, Test Evaluation, Doubt Solver) calls
 * this. It:
 *   - Sends the prompt to Gemini with JSON response mode
 *   - Parses the response as JSON
 *   - Validates against a Zod schema
 *   - Retries once (by default) if either step fails
 *
 * The retry passes the same prompt — Gemini is stochastic, so a second try
 * often yields valid output. We DON'T bake in a "fix your last output"
 * conversation because it makes prompt versioning brittle.
 */
export async function generateStructured<T>(
  opts: GenerateStructuredOptions<T>,
): Promise<StructuredResult<T>> {
  const model = getGeminiModel(opts.model);
  const maxRetries = opts.maxRetries ?? 1;
  let lastRaw = "";
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await model.generateContent(opts.prompt);
      const text = result.response.text();
      lastRaw = text;
      const parsed = JSON.parse(text);
      const validated = opts.schema.parse(parsed);
      return { data: validated, rawResponse: text, attempts: attempt };
    } catch (e) {
      lastError = e;
      // Don't sleep between retries — a second Gemini call is cheap and any
      // model warm-up already happened on the first.
    }
  }

  const detail =
    lastError instanceof Error ? lastError.message : "Unknown error";
  throw new AIStructuredError(
    `AI response validation failed after ${maxRetries + 1} attempts: ${detail}`,
    maxRetries + 1,
    lastRaw,
  );
}
