import type { z } from "zod";

import { getGeminiModel, type GeminiModelName } from "./client";

export interface StructuredImage {
  /** e.g. "image/jpeg", "image/png", "application/pdf" */
  mimeType: string;
  /** base64-encoded file bytes (no `data:` prefix) */
  data: string;
}

interface GenerateStructuredOptions<T> {
  prompt: string;
  /**
   * Optional multimodal parts — Gemini 1.5 accepts inline base64 for
   * images AND small PDFs. Total request size ≤ ~20 MB when using inline.
   * For larger files, use the Gemini File API (not implemented yet).
   */
  images?: StructuredImage[];
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
 * The reusable AI pattern for the whole app — text OR multimodal (Vision).
 *
 * Every AI feature (Quiz, Study Planner, Test Evaluation, Doubt Solver) calls
 * this. It:
 *   - Sends the prompt (and optional images/PDFs) to Gemini with JSON output
 *   - Parses the response as JSON
 *   - Validates against a Zod schema
 *   - Retries once (by default) if either step fails
 *
 * The retry sends the same prompt — Gemini is stochastic, so a second try
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

  const hasImages = Boolean(opts.images && opts.images.length > 0);
  const contents = hasImages
    ? [
        { text: opts.prompt },
        ...opts.images!.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.data },
        })),
      ]
    : opts.prompt;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await model.generateContent(contents as never);
      const text = result.response.text();
      lastRaw = text;
      const parsed = JSON.parse(text);
      const validated = opts.schema.parse(parsed);
      return { data: validated, rawResponse: text, attempts: attempt };
    } catch (e) {
      lastError = e;
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
