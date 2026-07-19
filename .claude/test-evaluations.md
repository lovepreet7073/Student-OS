# AI Test Evaluation

Biggest new-tech surface so far: **Gemini Vision** reads a student's
handwritten (or PDF) answers, grades them, and produces a per-question
report with marks, feedback, missing points, strengths, and study
recommendations.

## What this module locks in for the future

- **Vision extension to `generateStructured`** — one helper now handles text
  AND multimodal (`images: { mimeType, data }[]`, base64). Every future
  Vision feature (Doubt Solver with pictured question, Diagram Explainer)
  goes through this.
- **The `beginX → upload → submit` pattern** for multi-file async AI jobs.
  Any future feature that needs `many files → one AI job → structured
  report` (e.g., "grade my mock papers") copies this shape.

## Tables

```
public.test_evaluations
├── id, user_id, scope FKs
├── title, exam_type ('unit_test'|'chapter_test'|'board_model'|'practice'|'other')
├── max_marks, topics
├── status ('pending'|'evaluating'|'completed'|'failed')
├── ai_score numeric(6,2), ai_percentage numeric(5,2), ai_grade text
├── ai_summary text
├── answers jsonb            -- [{ question_number, question_text, student_answer, marks_awarded, max_marks, feedback, missing_points[], strengths[] }]
├── recommended_topics jsonb -- string[]
├── raw_gemini_response jsonb
├── error_message text (nullable)
├── evaluated_at (nullable)
└── created_at, updated_at

public.test_evaluation_pages
├── id, evaluation_id, user_id
├── page_number (unique per evaluation)
├── storage_path unique
├── mime_type, size_bytes
```

`answers` and `recommended_topics` live as **JSONB on the parent row**, not a
separate table. Rationale: we never query across answers (no "show me all
questions where marks < 3 across all my tests" today). If that need appears,
promote to a `test_evaluation_answers` table via migration.

`ai_score` and `ai_percentage` are always **recomputed from arithmetic**
after the AI responds — we never trust the model's arithmetic when we can
verify it (`sum of marks_awarded`, `score / max_marks × 100`).

## Storage

- **Bucket:** `test-answers` (separate from `study-files` so retention
  policies can differ — e.g., delete evaluations after 1 year, keep library
  indefinitely)
- **Path:** `{user_id}/eval-{eval_id}/page-{n}.{ext}`
- **Same RLS pattern** as study-files (`foldername[1] = auth.uid()`)

## Flow

```
1. beginEvaluation({ title, subjectId, examType, maxMarks, topics, pages: [{ pageNumber, fileName, mimeType, sizeBytes }] })
     → server: create evaluation row (status='pending') + N page rows
     → returns { evaluationId, bucket, pages: [{ pageNumber, storagePath }] }

2. Client uploads each page via supabase.storage.upload(...)

3. submitForEvaluation({ evaluationId })
     → status='evaluating' + revalidate detail page
     → parallel supabase.storage.download() → base64 for each page
     → generateStructured({ prompt, images, schema, maxRetries:1 })
     → clamp score, recompute percentage & grade from arithmetic
     → status='completed' with results
     → on failure: status='failed' + error_message set (retryable)
```

## Failure modes

| Failure                                | UX / handling                                              |
| -------------------------------------- | ---------------------------------------------------------- |
| Total pages > 18 MB combined           | Status→failed with "compress or split" hint                |
| Any page missing in Storage            | Status→failed with the missing path                        |
| Gemini invalid JSON / bad shape        | Retry once via `generateStructured`. Second failure → status→failed |
| AI's marks_awarded > max_marks         | Zod `superRefine` catches → retry                          |
| AI's score inconsistent with sum       | We recompute, don't trust                                  |
| Vercel Free 10s timeout                | Documented — status stays `evaluating` on client-side timeout, user can retry once server catches up |
| Client closes tab mid-Gemini           | Server keeps running; status flips to completed or failed independently |

## Retry semantics

- **`pending`** — user manually kicks off via "Start evaluation" button
- **`evaluating`** — Status card auto-refreshes every 3s via `router.refresh()` — no manual polling
- **`failed`** — "Retry" button calls `submitForEvaluation` again; server flips status back to `evaluating` and re-runs

## Grading policy (baked into the prompt)

- Class-N level rigor, not undergrad
- Generous but fair — reward partial understanding
- Concrete feedback ("include mitochondria's role in ATP production"), never abstract ("elaborate more")
- Missing points + strengths per answer — balanced feedback, not just deductions
- Grade thresholds: ≥90 A+, 80 A, 70 B+, 60 B, 50 C, 40 D, <40 F
- Feedback in the student's chosen medium language

## Routes

- **`/app/tests`** — history + "Grade a test" CTA + empty state
- **`/app/tests/new`** — creator form (title, subject, exam type, max marks, topics, multi-page upload)
- **`/app/tests/[id]`** — conditional render:
  - `pending` → "waiting to start"
  - `evaluating` → spinner + auto-refresh
  - `failed` → error + retry button
  - `completed` → **full report**: score visual, summary, per-question cards, recommended-topics card

## Discovery

- **Direct URL** `/app/tests`
- **Cross-link on `/app/study`** (the AI hub) — "Grade a paper test with AI" call-to-action card below the quiz history

## What this module does NOT do (yet)

1. **Auto-detect max marks from the paper** — user still enters it
2. **Photo enhancement** — no client-side auto-crop / contrast
3. **Multi-attempt tracking** — retake = new evaluation
4. **Per-answer voice notes** — text feedback only
5. **Export as PDF** — screenshot works for now
6. **Study Planner auto-integration** — recommended topics don't auto-add to the planner (small follow-up)
7. **Weak-topic trends** — over time, dashboard should surface "you consistently lose marks on X" (analytics module)

## Improvement ideas for later

1. **Async job pattern** with a real queue (needed for large tests on Vercel Free)
2. **File API upload** for pages > 20MB combined
3. **Recommended-topics → planner** — one-click "Add these topics to my study plan"
4. **Weak-topic trend widget** on the dashboard
5. **Photo pre-processing** — client-side auto-crop, deskew, contrast boost
6. **Bulk export** — download a printable PDF of the report
7. **Streaming** the report as it generates (paragraphs appear) — nice UX polish
