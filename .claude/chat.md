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

## Save-as-note (Module 40)

Every persisted assistant bubble carries a small `<SaveAsNoteButton>`
that opens a subject picker; on confirm, `saveMessageAsNote({ messageId,
subjectId })` inserts a note prefixed with `From your AI Study Chat:`
and returns the new note id so the dialog offers a direct link to it.
Only rows with `role='assistant'` and non-empty content are eligible.

## Vision chat (Module 41)

`chat_messages` gains an `attachments jsonb` column; a new
`chat-attachments` Storage bucket (10 MB max, PNG/JPEG/WEBP) holds the
image bytes under `{user_id}/{conversation_id}/{uuid}.{ext}`. Flow:

1. Client picks image → `beginAttachmentUpload` returns a signed upload
   URL (bytes never touch our server — same pattern as the study-space
   module).
2. Client PUTs the file directly to Supabase Storage.
3. Client posts `{ conversationId, message, attachments: [{ path,
   mimeType }] }` to `/api/chat`.
4. The API route downloads each attachment from Storage as base64 and
   forwards it as an `inlineData` part to `getGeminiChatModel()`.
5. Only the CURRENT turn's attachments are forwarded — prior images
   aren't re-sent (token-budget win; students can re-attach if
   needed).
6. Rendering fetches a short-lived signed URL client-side on mount
   via `getAttachmentUrl(path)` — RLS on `storage.objects` gates who
   can mint the URL.

Empty text is allowed when an image is attached — the API route
substitutes a stock "please look at this image" prompt.

## Ask-AI-about-this-note (Module 42)

`<AskAiButton>` on the note detail calls `startChatFromNote(noteId)`:
the action reads the note (RLS-gated), creates a conversation scoped
to the note's subject, seeds it with an opening user message
containing up to 3500 chars of note content plus an instruction to
"ask me a question to check I've understood", and `redirect()`s to
`/app/chat/{id}?auto=1` — the same `?auto=1` handshake as
`<NewChatForm>` so the assistant auto-answers.

## What this module does NOT do

- **Message editing / regeneration** — no "regenerate this reply" button.
- **Rate limiting** — deferred until we see abuse. Slot into the
  API route header logic when needed.
- **Conversation naming** — one-shot auto-title from the first message.
  No rename UI in v1.
- **Voice input** — deferred.
- **Web search grounding** — Gemini's `googleSearchRetrieval` tool is
  out of scope; the assistant answers from its own training only.
- **Multi-image attachments** — one image per message in v1. Schema
  allows an array but the client picker is single-file.
- **Re-sending prior attachments in history** — turn-local only, per
  the token-budget note above.

## Enhancement ideas

1. **Message editing** — edit a user message → truncate messages after
   it → regenerate.
2. **Voice input** — Web Speech API → `POST /api/chat` unchanged.
3. **PDF attachments** — same `inlineData` path; add `application/pdf`
   to the bucket allowlist and the schema.
4. **Multi-image messages** — expand the client picker to accept up to
   4 images; the API route already loops.
5. **Conversation folders** — group chats by topic when the list gets
   long.
6. **Continue-chat-in-note** — reverse of Module 42: when a chat
   surfaces a keeper explanation, one-click convert the whole
   conversation into a note.
