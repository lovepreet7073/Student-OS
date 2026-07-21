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
    .select("role, content, attachments")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  if (msgErr) {
    return NextResponse.json(
      { error: "Couldn't load history" },
      { status: 500 },
    );
  }

  const isRegenerate = parsed.data.mode === "regenerate";

  // ---- Determine which message we're answering ----
  //
  // `send` mode: insert the incoming user message, then answer it.
  //   - History we hand to Gemini is the prior messages (without the new one).
  //   - `currentText` is `parsed.data.message`.
  //   - `currentAttachments` are `parsed.data.attachments`.
  //
  // `regenerate` mode: the trailing message in the DB is already the
  //   user question we want re-answered (edit-message or
  //   prepare-regenerate placed it there). We DON'T re-insert; we DON'T
  //   include it in history — we pull its content and attachments out
  //   and hand them to `sendMessageStream` as the current turn instead.
  let historyForGemini: typeof priorMsgs = priorMsgs ?? [];
  let currentText = parsed.data.message;
  let currentAttachments = parsed.data.attachments ?? [];

  if (isRegenerate) {
    const tail = (priorMsgs ?? []).at(-1);
    if (!tail || tail.role !== "user") {
      return NextResponse.json(
        { error: "Nothing to regenerate" },
        { status: 400 },
      );
    }
    historyForGemini = (priorMsgs ?? []).slice(0, -1);
    currentText = tail.content;
    const tailAttachments = Array.isArray(tail.attachments)
      ? (tail.attachments as { path?: string; mime_type?: string; mimeType?: string }[])
      : [];
    currentAttachments = tailAttachments.flatMap((a) => {
      const mime = (a.mime_type ?? a.mimeType) as
        | "image/png"
        | "image/jpeg"
        | "image/webp"
        | "application/pdf"
        | undefined;
      if (!a.path || !mime) return [];
      return [{ path: a.path, mimeType: mime }];
    });
  } else {
    const attachmentsForDb = currentAttachments.map((a) => ({
      path: a.path,
      mime_type: a.mimeType,
    }));

    const { error: insertUserErr } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conv.id,
        user_id: user.id,
        role: "user",
        content: currentText,
        attachments: attachmentsForDb,
      });
    if (insertUserErr) {
      return NextResponse.json(
        { error: "Couldn't save your message" },
        { status: 500 },
      );
    }
  }

  // Load current-turn attachments as base64 for Gemini Vision. Only the
  // NEW message's attachments are forwarded — re-sending prior images
  // every turn would blow up the token budget (ADR-0027).
  const inlineImages: Array<{ mimeType: string; data: string }> = [];
  for (const a of currentAttachments) {
    const { data: blob, error: dlErr } = await supabase.storage
      .from("chat-attachments")
      .download(a.path);
    if (dlErr || !blob) continue;
    const buf = Buffer.from(await blob.arrayBuffer());
    inlineImages.push({ mimeType: a.mimeType, data: buf.toString("base64") });
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
    ...historyForGemini.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    })),
  ];

  const model = getGeminiChatModel();
  const chat = model.startChat({ history });

  const encoder = new TextEncoder();
  let fullText = "";

  // Compose the current message's parts. Gemini expects either a plain
  // string OR an array of `Part`s. When there's an image, we must send
  // an array with `inlineData` first (Vision guideline) followed by the
  // text prompt.
  const fallbackPrompt =
    inlineImages.some((img) => img.mimeType === "application/pdf")
      ? "Please read this document and help me understand it."
      : "Please look at this image and help me understand it.";

  const messageParts =
    inlineImages.length > 0
      ? [
          ...inlineImages.map((img) => ({
            inlineData: { mimeType: img.mimeType, data: img.data },
          })),
          {
            text:
              currentText.trim().length > 0
                ? currentText
                : fallbackPrompt,
          },
        ]
      : currentText;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(messageParts as never);
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
