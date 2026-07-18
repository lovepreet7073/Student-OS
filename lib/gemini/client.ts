import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

import { requireServerEnv } from "@/lib/env";

export type GeminiModelName = "gemini-1.5-flash" | "gemini-1.5-pro" | "gemini-2.0-flash-exp";

let cached: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (cached) return cached;
  cached = new GoogleGenerativeAI(requireServerEnv("GEMINI_API_KEY"));
  return cached;
}

export function getGeminiModel(
  model: GeminiModelName = "gemini-1.5-flash",
): GenerativeModel {
  return getClient().getGenerativeModel({
    model,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });
}
