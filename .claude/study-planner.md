# AI Study Planner

Second AI feature — validates that the `generateStructured` pattern from
Module 6 scales to a bigger, structured output. Where Quiz asks for 5–15
questions, the Planner asks for **60 days × 4 sessions = 240 items** in the
worst case.

## Tables

```
public.study_plans
├── id, user_id, scope FKs
├── title, goal (nullable)
├── start_date, end_date        (calendar dates, inclusive)
├── daily_hours                 (1..10)
├── focus_subject_ids uuid[]
├── is_active bool              (UNIQUE partial index: one active per user)
├── raw_gemini_response jsonb
└── created_at, updated_at

public.study_plan_items
├── id, plan_id, user_id
├── plan_date                   (converted from AI's day_offset)
├── ordinal                     (unique per plan_date)
├── subject_id (nullable, on delete set null)
├── subject_name                (persisted — survives subject retirement)
├── topic, notes
├── duration_minutes
└── completed_at (nullable → done)
```

**Two subtle decisions:**

1. **`subject_name` is stored on the item**, not looked up via FK. If a subject
   gets retired or renamed, the plan doesn't break. FK is for filtering; the
   name is for display.
2. **Partial unique index `WHERE is_active = true`** on `study_plans(user_id)`
   means the DB enforces "exactly one active plan per user" — set-active is
   two updates in a transaction-safe order (deactivate → activate).

## AI infrastructure — same pattern as Quiz

```ts
const aiResult = await generateStructured({
  prompt: buildStudyPlanPrompt({ ctx, focusSubjects, goal, startDate, endDate, daysCount, dailyHours }),
  schema: geminiStudyPlanResponseSchema,
  maxRetries: 1,
});
```

Every AI feature uses the same helper. Same retry semantics, same error shape.

## Prompt design (see [lib/gemini/prompts/study-plan.ts](../lib/gemini/prompts/study-plan.ts))

Key choices:
- **Day-relative offsets** (`day_offset: 0` = start_date, `day_offset: N` = start_date + N days).
  The AI doesn't reason about the calendar; we convert offsets back to dates
  when persisting. Fewer chances for date-parsing bugs.
- **Rotate subjects across days** — explicit instruction, since Gemini has a
  bias to cluster the same subject.
- **Duration in multiples of 5**, 20–90 minutes — round numbers feel more
  intentional.
- **Order sessions hardest first** — matches study advice (do hard cognitive
  work when fresh).
- **Notes must be actionable** — "Focus on this, watch out for that" — not
  a rehash of the topic name.

## Server Actions

| Action                    | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `generatePlan`            | Full flow: validate → scope → Gemini → deactivate old active → persist |
| `getPlan`                 | Plan + items in parallel                                 |
| `listPlans`               | History + per-plan completion counts (single aggregate query) |
| `completeItem`            | Set/unset completed_at, revalidates planner + dashboard  |
| `deletePlan`              | Cascades to items via FK                                 |
| `setActivePlan`           | Deactivate current active, then flip target on            |
| `getActivePlanToday`      | Dashboard widget helper — items where `plan_date = today` in the active plan |

## Failure modes

| Failure                              | UX                                                       |
| ------------------------------------ | -------------------------------------------------------- |
| Missing `GEMINI_API_KEY`             | Toast: "AI service is unavailable"                       |
| Gemini output fails schema (e.g. duration_minutes > 240) | Retry once via `generateStructured`; second failure → friendly toast with "narrower window / clearer goal" hint |
| Item batch insert fails after plan insert | Best-effort cleanup: delete the plan row                |
| Focus subject not in user's active list | VALIDATION error with field-level message               |
| Plan span > 60 days                  | Zod `superRefine` catches on client                      |
| End date before start date           | Zod `superRefine` catches                                |

## Routes

- `/app/planner` — history + "New plan" CTA + empty state
- `/app/planner/new` — creator form (title, dates, hours/day, focus subjects, goal)
- `/app/planner/[id]` — plan detail: back nav, active badge, goal, progress bar, action row (New / Set active / Delete), day cards grouped by date

## Dashboard integration — [features/dashboard/components/todays-sessions.tsx](../features/dashboard/components/todays-sessions.tsx)

Server component. Fetches today's sessions from the active plan. Renders:
- **No active plan** → returns `null` (widget disappears; clean dashboard)
- **Active plan, no items today** → compact "no sessions" card (rest day)
- **Active plan, items today** → session rows + "See full plan" link

Same cross-feature widget import pattern as tasks
(features/dashboard → features/study-planner, per ADR-0013).

## What this module does NOT do

- **Regenerate button** (same params, new AI call) — trivial follow-up
- **Item editing** — delete-and-regenerate for now
- **Reorder within a day** — needs drag-and-drop
- **Reschedule to another day** — needs an edit UI
- **Plan sharing** — private only
- **Exam-date-aware planning** — currently uses free-form `goal` text; a
  future improvement is a structured `exam_target_date` on profiles fed into
  the prompt

## Improvement ideas for later

1. Regenerate action that keeps params but calls Gemini again
2. "Reschedule item to X day" swap action
3. Streak based on % of scheduled items completed
4. Prompt A/B testing via `prompt_version` column
5. Weak-topic feedback loop: after quizzes, feed missed topics into the next planner call
