# Academic Identity System

The spine every future StudyOS feature bolts onto. Every student's saved
preferences drive filtering, personalization, and AI context injection —
**nothing about boards, mediums, classes, or subjects is hardcoded in code.**

## Tables

```
boards ──┐          mediums ─┐          classes ──┐
         └──┬──────────────┴────────────────────┘
            ▼
        subjects  (board × class × medium × name, unique)
            ▲
            │
    user_subjects (N:M) ────┐
                             ▼
                     user_preferences (1:1 with auth.users)
                     ├─ board_id       (FK)
                     ├─ medium_id      (FK)
                     ├─ class_id       (FK)
                     ├─ preferred_language  (text, 2-8 chars)
                     └─ updated_at trigger
```

**Reference tables** (`boards`, `mediums`, `classes`, `subjects`) — public
read for `authenticated` role, `is_active = true` filtered by RLS. No writes
from client — new rows added via migrations.

**User tables** (`user_preferences`, `user_subjects`) — read/write own only.
`auth.uid() = user_id` in every RLS policy.

## Onboarding gate

- **Middleware** (`middleware.ts`) → auth check only. Fast, edge-friendly.
- **`/app/*` layout** → calls `requireOnboardedProfile()`. Redirects to
  `/onboarding` if the user has no `user_preferences` row.
- **`/onboarding/page.tsx`** → the opposite: redirects to `/app/dashboard`
  if the user IS already onboarded. Prevents an onboarded user from
  re-entering the wizard by URL.

## Horizontal helpers — every feature uses these

### `lib/academic/scope.ts` — `getAcademicScope()`

Returns the caller's `{ userId, boardId, classId, mediumId, subjectIds }`.
Wrapped in React `cache()` so multiple RSCs in one request share one query.

```ts
const scope = await getAcademicScope();
supabase.from("notes")
  .select()
  .eq("board_id", scope.boardId)
  .eq("class_id", scope.classId)
  .in("subject_id", scope.subjectIds);
```

### `lib/gemini/context.ts` — `getStudentContext()` + `buildStudySystemPrompt()`

Distills the profile into human-readable strings for Gemini prompts:
board name, class name, medium name + native name, subject names, UI locale.

```ts
const ctx = await getStudentContext();
const prompt = buildStudySystemPrompt(ctx, "Explain photosynthesis");
const result = await getGeminiModel().generateContent(prompt);
```

Every AI Server Action (Chat, Summary, Quiz, Flashcards, Doubt Solver) calls
this. **No feature reinvents its own prompt scaffolding.**

## i18n

- **`lib/i18n/config.ts`** — `SUPPORTED_LOCALES`, `LOCALE_METADATA`, helpers.
- **`lib/i18n/messages/{en,pa,hi}.json`** — dictionaries. Add keys as strings
  are extracted from components.
- **`i18n.ts`** at project root — next-intl entry. Locale resolves from the
  user's saved `preferred_language`. No URL prefix, no `[locale]` segment.
- **`LOCALE_METADATA`** carries a `released` flag — unreleased locales show
  as "Coming soon" and can't be selected until their dictionary is complete.

**Rule for every new string added anywhere in the app:** it goes through
`useTranslations()` (client) or `getTranslations()` (server), never
hardcoded. Existing Module 0/1 strings will be migrated gradually.

## Server Actions

All in `features/academic-identity/actions/`:

| Action                 | Purpose                                                | Cached |
| ---------------------- | ------------------------------------------------------ | ------ |
| `getReferenceData`     | boards + mediums + classes in parallel                 | ✔      |
| `getSubjects`          | subjects filtered by (board, class, medium)            |        |
| `getMyProfile`         | user's full profile with joined reference data         | ✔      |
| `saveMyProfile`        | upsert preferences + replace user_subjects             |        |

`getMyProfile` and `getReferenceData` use React `cache()` — the layout, the
provider, and downstream RSCs can all call them freely in one request.

## Client access

`app/app/layout.tsx` wraps `/app/*` in `<AcademicProfileProvider>`. Any client
component under `/app/*` can `useAcademicProfile()` and get the current
profile synchronously — no fetch, no loading state.

## Adding a new board / class / subject

Migrations only. Example new subject:

```sql
insert into public.subjects (board_id, class_id, medium_id, name, slug, sort_order)
select b.id, c.id, m.id, 'Sanskrit', 'sanskrit', 8
from public.boards b, public.classes c, public.mediums m
where b.slug='cbse' and c.name='10' and m.slug='english'
on conflict (board_id, class_id, medium_id, slug) do nothing;
```

## Seeds (Module 2 initial)

- **Boards:** CBSE, ICSE, PSEB, HBSE, RBSE
- **Mediums:** English (en), Hindi (hi), Punjabi (pa)
- **Classes:** 6, 7, 8, 9, 10, 11, 12
- **Subjects:** PSEB × Class 10 × {English, Punjabi} + CBSE × Class 10 ×
  {English, Hindi}. Rest added via subsequent migrations.
