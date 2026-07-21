import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiChatModel } from "@/lib/gemini/client";
import { buildHelpSystemPrompt } from "@/lib/gemini/prompts/help";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * In-app helper chatbot endpoint (Module 55).
 *
 * Transient: no DB persistence. The client keeps the message history in
 * state and re-sends the whole thing each turn — simpler than storing
 * ephemeral help sessions that would clutter the main chat list.
 *
 * Auth is gated (must be signed in) so anon users can't spend our Gemini
 * quota, but no student-scope filtering — the helper answers product
 * questions, not syllabus ones.
 */
export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .default([]),
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Gemini `history` requires strict user/model alternation. We prepend
  // a synthetic seeded turn carrying the system prompt so the actual
  // conversation opens with a user message.
  const history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [
    { role: "user", parts: [{ text: buildHelpSystemPrompt() }] },
    { role: "model", parts: [{ text: "Got it — I'm ready to help you use StudyOS." }] },
    ...parsed.data.history.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    })),
  ];

  const model = getGeminiChatModel("gemini-1.5-flash");
  const chat = model.startChat({ history });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(parsed.data.message);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`\n\n[Sorry — the helper hit an error: ${msg}]`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
