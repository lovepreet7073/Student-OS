# AI Study Chat

Module 37. First streaming AI feature — multi-turn conversations with a
syllabus-aware Gemini persona.

## Why this breaks the Server-Actions-first rule

Server Actions in Next 15 finalise their response into a single JSON
payload — they can't stream tokens as they arrive. Chat UX is
streaming-first (typing indicator, tokens appearing letter by letter),
so this is one of the explicit "streaming" exceptions from the
Server-Actions-first constitution (ADR-0002 carve-out; see ADR-0026).

The **write path** for messages stays split:
- One-shot mutations (create conversation, delete conversation) use Server
  Actions like every other feature.
- The stream+persist step uses the API route `POST /api/chat`.

## Data model

```
public.chat_conversations
├── id, user_id, subject_id (nullable), title, created_at, updated_at

public.chat_messages
├── id, conversation_id, user_id ← denormalized for trivial RLS
├── role ('user' | 'assistant'), content
├── created_at
```

`user_id` denormalised on `chat_messages` so RLS is `auth.uid() = user_id`
— identical pattern to `flashcards`, `quiz_questions`, etc.

Titles auto-derive from the first ~40 chars of the opening user message.

## Streaming flow — `POST /api/chat`

1. Auth check → 401 if signed out.
2. Load student context via `getStudentContext()` — same helper every AI
   feature uses.
3. Load conversation + prior messages (RLS filters).
4. Insert the incoming user message immediately (survives a client
   hang-up mid-stream).
5. Build Gemini `history` array — inject the `buildChatSystemPrompt`
   output as a synthetic `user → model "OK"` opener, then append every
   prior message.
6. Call `getGeminiChatModel()` — the prose-output variant of
   `getGeminiModel()` (no `responseMimeType: application/json`).
7. `sendMessageStream` → for-await → `controller.enqueue()` on each
   chunk.
8. In `finally`: persist the full assistant reply, bump the conversation's
   `updated_at`, revalidate `/app/chat/{id}`.

If the client aborts mid-stream, whatever tokens were buffered still get
saved — partial data > lost data.

## Client streaming

`<ChatView>` reads the response body with `getReader()` + `TextDecoder`.
Chunks append to a `pending` state; when the reader is done we clear
`pending` and call `router.refresh()` so the server-rendered messages
pull the new persisted rows.

`?auto=1` on the initial navigation (set by `<NewChatForm>`) auto-fires
the first assistant reply — the student doesn't have to click "Send" on
their own opening message.

## Prompt

`lib/gemini/prompts/chat.ts` writes a system prompt tuned for study
help:
- Injects board, class, medium, and (optionally) the subject scope.
- Enforces the study-medium language.
- Enforces concise, one-example answers.
- Encourages an admission of uncertainty over invented facts.

## Routes

- `/app/chat` — list of conversations
- `/app/chat/new` — subject picker + first-message textarea
- `/app/chat/[id]` — the conversation view + streaming input

Not in the 5-item nav. Discoverable via a Workspace tile.

## What this module does NOT do

- **Message editing / regeneration** — no "regenerate this reply" button.
- **Attachments (images, PDFs)** — text-only for v1. Vision chat is a
  future extension: same infra, add `inline_data` parts to the request.
- **Rate limiting** — deferred until we see abuse. Slot into the
  API route header logic when needed.
- **Conversation naming** — one-shot auto-title from the first message.
  No rename UI in v1.
- **Voice input** — deferred.
- **Web search grounding** — Gemini's `googleSearchRetrieval` tool is
  out of scope; the assistant answers from its own training only.

## Enhancement ideas

1. **Save-as-note** — one-click "save this reply as a note" using the
   existing notes create action.
2. **Message editing** — edit a user message → truncate messages after
   it → regenerate.
3. **Voice input** — Web Speech API → `POST /api/chat` unchanged.
4. **Vision-enabled chat** — accept image attachments via the same
   `inlineData` pattern the test evaluation feature uses.
5. **Conversation folders** — group chats by topic when the list gets
   long.
