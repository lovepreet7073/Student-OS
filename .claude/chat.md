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

## Edit + regenerate (Module 43)

`POST /api/chat` gained a `mode` field: `send` (default) or
`regenerate`. In regenerate mode the API route DOESN'T insert a new
user row — it pulls the trailing user turn from history and uses that
as the current turn instead. This powers two flows:

- **Edit**: `<MessageBubble>` pencil on any persisted user turn opens
  an inline textarea. On save, `editMessage({ messageId, content })`
  overwrites the row AND deletes every message with `created_at >`
  the edited row's timestamp (assistant reasoning based on the old
  text is now invalid). The client then hits `/api/chat` with
  `mode: 'regenerate'` for a fresh reply.
- **Regenerate**: a small refresh chip on the last assistant reply
  calls `prepareRegenerate({ conversationId })` — deletes just the
  trailing assistant row and returns the user question — then streams
  a fresh reply via `mode: 'regenerate'`.

Bonus fix: the `?auto=1` handshake now also uses `mode: 'regenerate'`,
which fixes an old bug where `<NewChatForm>` and `startChatFromNote`
seeded a user message AND then the API route inserted a duplicate copy.

## PDF attachments (Module 44)

Bucket allowlist now includes `application/pdf`; size limit bumped
10 MB → 25 MB because scanned pages routinely exceed 10. Client picker
`accept` widened to `image/png,image/jpeg,image/webp,application/pdf`;
the preview card falls back to a filecard when the picked type is a
PDF. `<AttachmentThumb>` renders persisted PDFs as a clickable
filecard, images stay as `<Image>`. The Gemini forward path is
unchanged — 1.5-flash accepts PDF `inlineData` natively.

## Voice input (Module 45)

`useVoiceInput()` wraps the Web Speech API. On supported browsers
(Chrome/Edge/Safari) the input toolbar gains a mic button. Tapping
starts a `continuous`, `interimResults` recognition session; the
interim transcript renders live above the input, and completed phrases
append to the textarea using a `voiceBaselineRef` snapshot of pre-mic
content so existing typed text isn't wiped. Sending or hitting the
mic again stops recognition. Firefox and older WebKit builds return
`supported: false` — the button never renders instead of showing a
dead affordance.

## Chat → note (Module 46)

`<SaveChatAsNoteButton>` in the chat header flattens every turn into
one note via `saveConversationAsNote({ conversationId, subjectId })`.
Format: `**You:**` / `**AI:**` blocks separated by `---`. Attachments
aren't copied — they stay in the chat — but each turn that had one
gets a `_[N attachments — see original chat]_` marker so the reader
knows why the note might look incomplete. Success screen offers a
direct link to the new note.

## Chat rename (Module 47)

`<EditableChatTitle>` replaces the static header title. Click reveals
an inline `<input>`; Enter or blur saves via
`renameConversation({ conversationId, title })`; Escape cancels. The
Server Action revalidates both `/app/chat` and the current chat page
so the sidebar and header stay in sync.

## Multi-attachment messages (Module 48)

`sendMessageSchema.attachments.max(1)` → `.max(4)`; the client picker
gained the `multiple` attribute and a preview grid. Each thumb has an
X to remove just that one. Blob URLs get revoked on removal and on
component unmount so we don't leak between sessions. The API route
already looped, so no server change was needed. `MAX_ATTACHMENTS = 4`
in the component matches the schema — bumping one requires bumping
the other.

## What this module does NOT do

- **Rate limiting** — deferred until we see abuse.
- **Web search grounding** — Gemini's `googleSearchRetrieval` tool is
  out of scope; the assistant answers from its own training only.
- **Re-sending prior attachments in history** — turn-local only (ADR-0027).
- **Editing an already-attached image** — edit only rewrites text.
- **Voice on Firefox** — Web Speech API not implemented there; button
  is hidden.

## Enhancement ideas

1. **Conversation folders** — group chats by topic when the list gets
   long.
2. **Undo edit** — cache the previous message body for 30 s so a
   mis-edit can be reverted without losing the follow-up.
3. **Speech language switcher** — surface `lang` picker for non-English
   dictation (the hook already accepts it as a parameter).
4. **Reorder attachments** — drag-to-sort the preview grid before send.
