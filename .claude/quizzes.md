# AI Quizzes

First real AI feature. Establishes the patterns every subsequent AI module
(Study Planner, Test Evaluation, Doubt Solver) will copy.

## The AI infrastructure — the piece that outlives this module

**Every future AI feature calls one helper:** `generateStructured<T>()` in
[lib/gemini/structured.ts](../lib/gemini/structured.ts).

```ts
const result = await generateStructured({
  prompt: buildQuizPrompt({ ctx, subjectName, topic, questionCount, questionTypes }),
  schema: geminiQuizResponseSchema,
  maxRetries: 1,
});
// result.data is a Zod-validated T
// result.rawResponse is the raw Gemini text (stored in DB for debugging)
// result.attempts tells you if we needed the retry
```

The helper:
1. Calls Gemini in JSON output mode
2. Parses the response
3. Validates against your Zod schema
4. Retries once on parse or validation failure — no conversational "please fix your last output" (that makes prompt versioning brittle)
5. Throws `AIStructuredError` with the last raw response for logging

**Every AI feature ships:**
- A pure prompt template in `lib/gemini/prompts/{feature}.ts` (function, no side effects)
- A Gemini output schema in `features/{feature}/schemas/gemini.ts` (Zod, with `superRefine` for cross-field rules)
- A Server Action that calls `generateStructured()` + persists + revalidates

Never call `getGeminiModel()` directly from a feature. Always route through
`generateStructured()` — it's where retry/rate-limit/observability will land.

## Data model

```
public.quizzes
├── id, user_id, scope FKs
├── topic (free text)
├── question_types (text[])
├── total_questions, correct_count (nullable)
├── completed_at (nullable — presence = submitted)
├── raw_gemini_response jsonb (debug snapshot)
└── created_at, updated_at

public.quiz_questions
├── id, quiz_id, user_id  ← denormalized for trivial RLS
├── ordinal (unique per quiz)
├── type ('mcq' | 'true_false' | 'fill_blank' | 'short_answer')
├── question, options jsonb, correct_answer, explanation
└── created_at

public.quiz_answers
├── id, quiz_id, question_id, user_id
├── user_answer, is_correct (nullable — null = self-mark pending)
├── self_marked_correct (nullable)
└── answered_at, UNIQUE(quiz_id, question_id)
```

**`user_id` denormalized** on `quiz_questions` and `quiz_answers` so RLS is
`auth.uid() = user_id` — no EXISTS-across-tables policy needed.

**One attempt per quiz.** Retakes = new quiz. Data model stays simple.

## Grading

- **MCQ / True-False:** exact string match on submit
- **Fill-in-the-blank:** case-insensitive whitespace-collapsed match
- **Short answer:** `is_correct` stored as `null` → the results screen prompts the student to self-mark against a reference answer. Honesty system for MVP; AI grading of short answers ships in the Test Evaluation module.

`correct_count` is recomputed on every `selfMark` action so the score card
updates in place as students mark their short-answer responses.

## Server Actions — [features/quizzes/actions/](../features/quizzes/actions/)

| Action           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `generateQuiz`   | Validates → academic scope check → Gemini call → persist         |
| `getQuiz`        | Quiz + questions + answers in 3 parallel queries                 |
| `listQuizzes`    | Recent 30 for the user, scoped by RLS                            |
| `submitQuiz`     | Grades all answers on submit, sets completed_at + correct_count  |
| `selfMark`       | Adjust short-answer correctness, recompute correct_count         |
| `deleteQuiz`     | Cascades to questions + answers via FK                           |

## Failure modes handled

| Failure                              | UX                                                          |
| ------------------------------------ | ----------------------------------------------------------- |
| Missing `GEMINI_API_KEY`             | Server Action throws → toast "AI service is unavailable"   |
| Gemini returns invalid JSON          | Retry once (structured helper). Still fails → friendly toast |
| Gemini output fails Zod validation   | Same retry path. Common cause: MCQ with 3 options instead of 4 — Zod `superRefine` catches this. |
| Question insert fails after quiz insert | Best-effort cleanup deletes the orphan quiz row.        |
| Subject not in student's active list | Returned as VALIDATION error with field-level message.      |

## Routes

- `/app/study` — history + "New quiz" CTA + empty state
- `/app/study/new` — generator form (subject, topic, count 5/10/15, type checkboxes)
- `/app/study/[id]` — **conditional render**: `<QuizTaker>` if `completed_at` is null, else `<QuizResults>`

## Question type UI

- **MCQ** — radio group; each option a 52px+ tap card
- **True/False** — two 56px tall side-by-side buttons
- **Fill-in-blank** — single-line Input
- **Short answer** — 4-row Textarea

The taker's sticky bottom bar disables the submit button until every question
has a non-empty answer. Progress bar top-of-viewport shows `N / total answered`.

## What this module does NOT do

- **Timed quizzes** — no countdown
- **Multiple attempts per quiz** — retake = new quiz
- **AI grading of short answers** — self-mark for MVP. Test Evaluation module (later) reuses `generateStructured` to score handwritten/typed answers against a rubric
- **Streaming responses** — Gemini structured-output mode is batch. Fine for ≤ 20 questions.
- **Difficulty levels** — one prompt path, model chooses complexity from Class + topic
- **Regeneration of specific questions** — delete + retry the whole quiz
- **Rate limiting** — deferred until we see abuse. Will slot into `generateStructured` when needed.

## Improvement ideas for later

1. **`quiz_generations` audit table** with prompt_version, model, latency, token counts → easy iteration on prompts
2. **AI short-answer grading** (reuse `generateStructured` with a grading schema)
3. **Weak-topic feed** on the dashboard — subjects where recent score < 60%
4. **Retry queue** — persist a failed generation so users can tap "Try again" without re-typing settings
5. **From-note generation** — "Generate a quiz from this note" as a Server Action that pipes note content into the topic parameter
6. **Streaming** via `streamGenerateContent` — show questions as they arrive
