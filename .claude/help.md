# StudyOS Helper (in-app chatbot)

Module 55. A distinct AI chatbot that answers "how do I use StudyOS?"
questions — separate from the syllabus tutor at `/app/chat`.

## Why a second chatbot?

The two chatbots serve different intents. Mixing them makes both worse:

- **AI Study Chat** (`/app/chat`, Modules 37-46) is a *subject* tutor. It
  knows your board/class/medium/subjects and answers homework and concept
  questions. It persists conversations, supports voice + images + PDFs,
  and streams via `POST /api/chat`.
- **StudyOS Helper** (`/app/help`, Module 55) is a *product* assistant. It
  knows the feature inventory of the app itself — where to find things,
  how features connect, common workflows. Sessions are transient (no DB
  writes), no attachments, no persistence.

The Helper's system prompt (`lib/gemini/prompts/help.ts`) explicitly
redirects subject/homework questions to `/app/chat` so students learn
the difference by using it.

## Transport

`POST /api/help` — same streaming pattern as `/api/chat` (ADR-0026)
minus the DB writes. Auth gated (must be signed in), no student-scope
filtering, no attachments. Body: `{ message, history: [] }`. The client
re-sends the last ≤ 20 messages each turn — cheaper than persisting an
ephemeral help session.

## Client

`<HelpView>` at `/app/help` renders:
- Six suggested question tiles when the session is empty (so a
  first-time visitor gets a nudge, not a blank textarea).
- The usual streaming bubble UX, but simpler than the main chat (no
  edit / regenerate / save-as-note buttons — help answers don't warrant
  those).

## Access points

- Workspace tile "Helper" under the **Progress** section (Module 56 reorg).
- Desktop sidebar Shortcuts (Module 56).
- Directly at `/app/help`.

## What this module does NOT do

- Persist sessions — refresh the page and history is gone. Intended.
- Answer syllabus questions — the prompt redirects.
- Accept attachments — text-only.
- Support voice input — the primary chat has it; the Helper is a
  quick-lookup tool that doesn't need it.

## Enhancement ideas

1. **Contextual open** — a floating "?" bubble on every `/app/*` route
   that opens the Helper pre-scoped to the current feature.
2. **Feature-inventory single source** — right now the prompt lists
   every route + description inline. If the inventory grows, move it
   to a typed table in `lib/features.ts` and let the prompt read from
   there.
3. **Answer citation** — surface a link to `/app/{feature}` under each
   response so students can jump straight there.
