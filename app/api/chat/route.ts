import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getStudentContext } from "@/lib/gemini/context";
import { getGeminiChatModel } from "@/lib/gemini/client";
import { buildChatSystemPrompt } from "@/lib/gemini/prompts/chat";
import { getSupabaseServer } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/features/chat/schemas/chat";

/**
 * Streaming chat endpoint. Server Actions can't stream responses back to
 * the browser (Next 15 finalises them into a single JSON payload), so
 * this is one of the "streaming" exceptions to the Server-Actions-first
 * rule.
 *
 * Flow per POST:
 *   1. Auth check via Supabase (RLS guarantees ownership on all reads/writes).
 *   2. Load the conversation + prior messages.
 *   3. Insert the incoming user message as a row so it survives a client
 *      hang-up mid-stream.
 *   4. Ask Gemini to stream the reply; forward tokens to the client as
 *      plain text chunks over a ReadableStream.
 *   5. When the stream ends, persist the full assistant message and bump
 *      `conversations.updated_at`.
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getStudentContext();
  if (!ctx) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 403 },
    );
  }

  const { data: conv, error: convErr } = await supabase
    .from("chat_conversations")
    .select(
      `id, user_id, subject_id,
       subject:subjects ( name )`,
    )
    .eq("id", parsed.data.conversationId)
    .maybeSingle();

  if (convErr || !conv) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const { data: priorMsgs, error: msgErr } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  if (msgErr) {
    return NextResponse.json(
      { error: "Couldn't load history" },
      { status: 500 },
    );
  }

  const { error: insertUserErr } = await supabase.from("chat_messages").insert({
    conversation_id: conv.id,
    user_id: user.id,
    role: "user",
    content: parsed.data.message,
  });
  if (insertUserErr) {
    return NextResponse.json(
      { error: "Couldn't save your message" },
      { status: 500 },
    );
  }

  const subject = Array.isArray(conv.subject) ? conv.subject[0] : conv.subject;
  const systemPrompt = buildChatSystemPrompt({
    ctx,
    subjectName: subject?.name ?? null,
  });

  // Gemini's `history` array requires `parts` (not `content`) and alternates
  // user/model. We prepend a synthetic user turn carrying the system prompt
  // + an assistant "OK" so the actual conversation can start with a user turn.
  const history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I'm ready to help." }] },
    ...(priorMsgs ?? []).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    })),
  ];

  const model = getGeminiChatModel("gemini-1.5-flash");
  const chat = model.startChat({ history });

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(parsed.data.message);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`\n\n[Sorry — the AI hit an error: ${msg}]`),
        );
      } finally {
        controller.close();
        // Persist the assistant reply after the stream completes. If the
        // client disconnected mid-stream, `fullText` still holds whatever
        // Gemini produced up to that point — better to save partial than
        // lose it entirely.
        if (fullText.trim().length > 0) {
          await supabase.from("chat_messages").insert({
            conversation_id: conv.id,
            user_id: user.id,
            role: "assistant",
            content: fullText.slice(0, 20000),
          });
        }
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conv.id);
        revalidatePath(`/app/chat/${conv.id}`);
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
