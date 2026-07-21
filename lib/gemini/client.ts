import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

import { requireServerEnv } from "@/lib/env";

/**
 * Model names accepted by our helpers. `gemini-flash-latest` is
 * Google's evergreen alias — it always maps to their current stable
 * flash model, which is what we want for every text/JSON call.
 * `gemini-1.5-flash` and the 1.5-pro/2.0 exp names remain in the type
 * so callers that explicitly pin a specific model (e.g. for
 * regression testing) still typecheck; they'll just fail at call time
 * if the key's project doesn't have access.
 */
export type GeminiModelName =
  | "gemini-flash-latest"
  | "gemini-flash-lite-latest"
  | "gemini-pro-latest"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro"
  | "gemini-2.0-flash-exp";

/**
 * The default model every helper falls back to. Override per-call by
 * passing a specific model name, or override globally via the
 * `GEMINI_MODEL_NAME` env var — useful for A/B testing or rapid
 * migration when Google retires an alias.
 */
export const DEFAULT_GEMINI_MODEL: GeminiModelName =
  (process.env.GEMINI_MODEL_NAME as GeminiModelName | undefined) ??
  "gemini-flash-latest";

let cached: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (cached) return cached;
  cached = new GoogleGenerativeAI(requireServerEnv("GEMINI_API_KEY"));
  return cached;
}

export function getGeminiModel(
  model: GeminiModelName = DEFAULT_GEMINI_MODEL,
): GenerativeModel {
  return getClient().getGenerativeModel({
    model,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });
}

/**
 * Prose-output model — for streaming chat, doubt answers, and other
 * free-form responses. Does NOT set `responseMimeType: application/json`
 * so Gemini returns natural language instead of a JSON blob.
 */
export function getGeminiChatModel(
  model: GeminiModelName = DEFAULT_GEMINI_MODEL,
): GenerativeModel {
  return getClient().getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.7,
    },
  });
}
