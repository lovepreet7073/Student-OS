# AI Flashcards + Spaced Repetition

Module 28. Ties the `generateStructured` AI pattern to a scheduler (SM-2)
that decides which cards a student sees each session.

## The AI infrastructure — same pattern as quizzes

Same helper: `generateStructured<T>()` from [lib/gemini/structured.ts](../lib/gemini/structured.ts).
Same three files:

1. Prompt template: [lib/gemini/prompts/flashcards.ts](../lib/gemini/prompts/flashcards.ts)
2. Gemini output schema: [features/flashcards/schemas/gemini.ts](../features/flashcards/schemas/gemini.ts)
3. Generation action: [features/flashcards/actions/generate-deck.ts](../features/flashcards/actions/generate-deck.ts)

Two generation paths in one action:
- **From topic**: `{ subjectId, topic, cardCount }` — Gemini invents Q/A pairs from its own training.
- **From note**: same input + `sourceNoteId`. The action loads the note body and injects it into the prompt so cards are grounded in the student's own content.

## Data model

```
public.flashcard_decks
├── id, user_id, scope FKs (board/class/medium/subject)
├── title (from the topic input), description, source ('ai_topic' | 'ai_note' | 'manual')
├── source_note_id (nullable — links deck back to its origin note)
├── raw_gemini_response jsonb (debug snapshot)
└── created_at, updated_at

public.flashcards
├── id, deck_id, user_id ← denormalized for trivial RLS
├── ordinal (unique per deck), front, back, hint (nullable)
├── SM-2 state:
│   ├── ease_factor real default 2.5      (clamped [1.3, 4.0])
│   ├── interval_days integer default 0   (next interval in days)
│   ├── repetition integer default 0      (consecutive good/easy in a row)
│   ├── due_at timestamptz default now()  (when this card next appears)
│   ├── last_reviewed_at timestamptz
│   ├── lapses integer default 0
│   └── total_reviews integer default 0
└── created_at
```

**`user_id` denormalized** on `flashcards` so RLS is `auth.uid() = user_id` — no EXISTS-across-tables policy.

**Brand-new cards `due_at = now()`** so the first study session picks them up immediately (they're "new" until `total_reviews > 0`).

## Scheduler — SM-2

Implemented as a pure function in [features/flashcards/lib/sm2.ts](../features/flashcards/lib/sm2.ts). Standard SuperMemo-2 with a 4-button UI:

| Button | SM-2 quality | Behaviour |
|--------|-------------:|-----------|
| Again  | 0            | repetition→0, interval→1d, lapses++ |
| Hard   | 3            | repetition++, base interval × 0.7 (roughly) |
| Good   | 4            | repetition++, base interval × ease |
| Easy   | 5            | repetition++, base interval × ease × 1.3 (roughly) |

`ease_factor` nudges by `(0.1 - (5-q) × (0.08 + (5-q) × 0.02))`, clamped to `[1.3, 4.0]`.

**Preview intervals on buttons** are computed client-side by a simplified projection — the authoritative value comes back from the server after `reviewCard` returns.

## Server Actions — [features/flashcards/actions/](../features/flashcards/actions/)

| Action           | Purpose                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `generateDeck`   | Validate → scope check → optional note fetch → Gemini call → persist |
| `getDeck`        | Deck + all cards in 2 parallel queries; logs `flashcard_deck` activity |
| `listDecks`      | Recent decks + per-deck (total / due / new) counts                  |
| `reviewCard`     | Apply SM-2 to one card, persist, bump deck `updated_at`             |
| `deleteDeck`     | Cascades to cards via FK                                            |

## Routes

- `/app/flashcards` — list + "New deck" CTA
- `/app/flashcards/new` — generator form
- `/app/flashcards/[id]` — deck detail (stats + Study button + all-cards list)
- `/app/flashcards/[id]/review` — flip / rate loop

Not added to the 5-item nav (that's locked). Access via Workspace tile.

## Study session UX

1. Server computes the queue: `total_reviews = 0 || due_at <= now()`.
2. Client walks the queue: **front → tap "Show answer" → back + 4 rating buttons**.
3. On "Again", the card is re-appended to the queue (so it appears again this session).
4. Progress bar + `N / total` counter update on every rate.
5. When empty → success screen with per-quality tally.

## What this module does NOT do

- **Manual card authoring** — every deck is Gemini-generated for MVP. The `source = 'manual'` slot is reserved for a v2 authoring flow.
- **Deck editing** — cards are read-only after generation. Delete the deck and regenerate if the AI got it wrong.
- **Bulk study across decks** — one deck at a time. A "review everything due today" cross-deck view is on the enhancement list.
- **Custom SM-2 tuning** — no user-adjustable ease multiplier, initial ease, or graduating interval. Fine for MVP; power users get Anki.
- **Streaming generation** — batch Gemini call. 15–30 s wait with a "AI is thinking" hint.

## Cross-deck review inbox (Module 31)

`/app/flashcards/inbox` runs one `listDueCards()` query — every card the
user owns where `due_at <= now()`, ordered by `due_at asc`, capped at 60.
Reuses the same `<ReviewSession>` component with `exitHref="/app/flashcards"`.
Because `reviewCard` looks up `deck_id` from the row and revalidates that
deck's path, per-deck views stay in sync automatically. A `Flame`-badged
CTA at the top of `/app/flashcards` links here when any card is due.

## From-note generation (Module 32)

`<MakeFlashcardsButton>` on the note detail deep-links to
`/app/flashcards/new?subject=<id>&topic=<title>&noteId=<id>`. The
generator prefills its form; `generateDeck` sees `sourceNoteId`, loads
the note body via RLS, and passes it to the prompt as `sourceText` — the
AI must extract cards from that content, not general knowledge.

## Reviews audit + retention (Module 34)

`flashcard_reviews` is an append-only audit log. `reviewCard` writes one
row per tap: `{ card_id, deck_id, user_id, quality, ease_before,
ease_after, interval_after, reviewed_at }`. The insert is best-effort —
a failed audit does NOT roll back the SM-2 update on the card row.

Deck detail exposes **retention** — the fraction of reviews rated `good`
or `easy` — via `getDeckStats(deckId)`. Three parallel COUNT queries
against `flashcard_reviews`: total, correct, last-7-days. Retention is
`null` (rendered as "—") when the deck has zero reviews so we don't
falsely imply the student failed everything.

## Weak cards list (Module 38)

Deck detail groups cards where `total_reviews >= 3` and
`lapses / total_reviews > 0.3` into a "Needs more practice" section
above the full card list. Pure client-side filter over the same
`deck.cards` array — no extra query. Threshold is intentionally
conservative so a single lapse doesn't tag a card as weak.

## Review streak heatmap (Module 39)

`/app/flashcards` renders a 12-week GitHub-style heatmap plus current
and longest streaks, backed by `getReviewHeatmap(spanDays = 84)`.
Grouping runs in JS at the action layer — same trade-off as the teacher
daily-activity query (ADR-0025). Streak = consecutive days ending today
where at least one review happened. Empty when the audit table is empty,
so brand-new students see a helpful "Study any deck and your streak
starts here" prompt instead of a bare grid.

## Weak-cards-only session (Module 49)

`/app/flashcards/weak` runs `listWeakCards()` — cards where
`total_reviews >= 3 AND lapses / total_reviews > 0.3` (same threshold
as the deck-detail "Needs more practice" section, Module 38) — and
hands them to `<ReviewSession>` with `exitHref="/app/flashcards"`.
Ordered by lapse count desc so the toughest cards surface first. The
same SM-2 side-effects apply: reviewing a weak card here updates its
state exactly as if it were reviewed from the source deck.

A dedicated CTA on `/app/flashcards` — "Drill N weak cards" — appears
below the review-inbox button whenever `weakCount > 0`.

## Enhancement ideas

1. **Voice-first review** — TTS the front, microphone the answer, transcribe + auto-mark against `back`.
2. **Anki export** — dump a deck as a `.apkg` for students who already run Anki elsewhere.
3. **Interleaved cross-subject inbox filter** — "just Math today" toggle on the inbox route.
4. **Streak notifications** — remind the student before their streak breaks (needs a push-notification pipeline).
