# StudyOS — Project Memory

This file is loaded into Claude Code's context on every session in this repo. It is the durable
project brain. Keep it terse and load-bearing. Delegate detail to the sibling docs.

## Product

**StudyOS** is a production-grade SaaS AI-powered student learning platform. Target scale:
100,000+ students. Design north stars: Vercel, Linear, Notion, GitHub, Stripe.

## Tech Stack (locked)

- **Framework:** Next.js 15 (App Router, RSC-first, Turbopack dev)
- **Language:** TypeScript, `strict: true`, `noUncheckedIndexedAccess: true`
- **Styling:** Tailwind CSS v4 + shadcn/ui (new-york style), Geist font
- **Backend:** Supabase — Postgres, Auth, Storage. RLS on every table.
- **AI:** Google Gemini via `@google/generative-ai`
- **Forms:** React Hook Form + Zod
- **Deploy:** Vercel
- **Package manager:** pnpm

## Non-Negotiable Rules

0. **MOBILE-FIRST, PWA-READY.** Primary user is a Class 10 student on a budget Android phone.
   Design and code at 375px first; progressively enhance for tablet & desktop. Bottom nav on
   mobile, sidebar on desktop — never force desktop patterns onto mobile. See `mobile-first.md`.
1. **Server Components + Server Actions first.** API routes only when strictly necessary
   (webhooks, streaming, third-party callbacks).
2. **Feature-first architecture.** Business code lives in `features/{name}/{components,hooks,actions,schemas,types}`. `app/` routes are thin shells.
3. **No file over 300 lines.** Refactor before hitting the ceiling.
4. **Design tokens only.** Never hardcode colors, spacing, radius, shadows, or font sizes.
   Semantic color variables live in `app/globals.css`.
5. **Spacing scale:** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px only (Tailwind `1,2,3,4,5,6,8,10,12,16`).
6. **Every async action:** loading + empty + success + error + skeleton + retry. No blank screens.
7. **Every form:** React Hook Form + Zod resolver + accessible errors + correct `inputMode`/`autoComplete`/`enterKeyHint`.
8. **Every table:** RLS enabled, meaningful name, indexes on FKs and filter columns.
9. **No `any`.** Ever, unless truly unreachable — and then document why.
10. **Dark mode is first-class**, not an afterthought.
11. **Touch targets ≥ 44×44 px.** Applies to every interactive element on mobile.
12. **Lighthouse mobile ≥ 90.** Budget: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, initial JS ≤ 130KB gz.

## Folder Map

See `architecture.md`.

## Mobile-First Playbook

See `mobile-first.md` — the pre-code checklist, breakpoints, touch targets, and nav patterns.

## Academic Identity System

See `academic-identity.md` — the spine every feature depends on. Every module's
queries filter by `getAcademicScope()`. Every AI action injects context via
`getStudentContext()`. Never hardcode boards, classes, subjects, or mediums.

## Dashboard & App Shell

See `dashboard.md` — the chrome every `/app/*` route lives inside. Bottom nav
on mobile, sidebar on desktop. Nav destinations locked at 5. New dashboard
widgets go into `features/dashboard/components/` and compose into the home page.

## Notes Library

See `notes.md` — the first content feature. Notes are per-user AND scoped by
`(board, class, medium, subject)` — the Academic Identity System filter pattern
in action. Server Actions revalidate `/app/notes` on every mutation. Follow this
pattern for every future content module (papers, flashcards, tasks, etc.).

## Daily Tasks

See `tasks.md` — the second content feature. Same scope pattern as Notes plus
a nullable `subject_id` (cross-subject tasks) and `due_date` / `completed_at`
timestamps. Dashboard's "Today's plan" widget consumes it as a
`features/dashboard → features/tasks` composition — the first (documented)
cross-feature widget import (ADR-0013).

## AI Quizzes (and the AI pattern)

See `quizzes.md` — the first AI feature. Establishes `generateStructured<T>()`
in `lib/gemini/structured.ts` — the ONE helper every subsequent AI feature
(Planner, Test Evaluation, Doubt Solver) must call. Never `getGeminiModel()`
direct from a feature. Prompts live as pure template functions in
`lib/gemini/prompts/{feature}.ts`. Gemini response schemas live in
`features/{feature}/schemas/gemini.ts` with `superRefine` for cross-field rules.

## AI Study Planner

See `study-planner.md` — second AI feature. Same `generateStructured` pattern
scaled to bigger outputs (up to 60 days × ~4 sessions). Day-relative offsets in
the prompt (day 0, 1, 2…) instead of calendar dates — server converts offsets
to real dates on persist. Partial unique index enforces "one active plan per
user". Dashboard widget `<TodaysSessions>` renders null when no active plan.

## My Study Space (Storage patterns)

See `study-space.md` — first Storage-based feature. Establishes the
**direct-to-Storage upload pattern**: `beginUpload` server action reserves a
`{user_id}/{file_id}.{ext}` path, client uploads directly via
`supabase.storage.upload()` (RLS on `storage.objects` guarantees isolation),
then `completeUpload` inserts the metadata row. Bandwidth never crosses our
server. Every future upload feature (Test Evaluation, avatars, attachments)
must reuse this three-step flow — never proxy file bytes through our server.

## AI Test Evaluation (Gemini Vision + async AI)

See `test-evaluations.md` — third AI feature. **Extends
`generateStructured()`** to accept `images: { mimeType, data }[]` (base64
inline) — same helper handles text AND Vision. Establishes the
**`begin → upload → submit`** pattern for multi-file async AI jobs. AI's
arithmetic (score, percentage, grade) is always **recomputed server-side** —
trust concepts, verify math. Status lifecycle
`pending → evaluating → completed | failed` with `router.refresh()` polling.

## Auth v2 + Teacher role

See `auth-v2.md` — the marketing landing + split-screen auth built from
`StudyOS_Auth_v2_Deck.pptx`. Introduces `user_role: 'student' | 'teacher'`
on `user_preferences` (ADR-0014). Signup audience picker → `user_metadata.role`
→ `save-my-profile` → `user_preferences.user_role` → `profile.role`. Landing
audience toggle changes copy, not layout. `AuthShell` accepts a `marketingPanel`
slot — brand panel LEFT, form RIGHT on `lg+`.

## My Workspace

See `workspace.md` — the primary destination in `/app/*`, mounted at
`/app/workspace` (ADR-0019). Unifies every existing content type into one hub
with counts, quick actions, Recently opened / Recently uploaded feeds backed
by a new `activity_events` table, plus a global search entry point.
Callers append `await logActivity({...})` after successful reads/writes;
failures are swallowed by design.

Module 16 (share-via-link, ADR-0020): notes have `visibility` + `share_token`;
`/s/n/[token]` renders a read-only public view. Module 17 (global search,
ADR-0021): `/app/search` runs four parallel ILIKE queries across notes,
files, tasks, community_notes with grouped results.

## Auth: OTP primary

Email OTP is the default sign-in / sign-up path (ADR-0018). `sendEmailOtp` →
6-digit code → `verifyEmailOtp` → redirect. Google OAuth stays above the
divider. Password field only appears when the user taps "Use password
instead" — kept as a fallback for existing users, will be removed once the
password base is empty. OTP schemas + actions live in
`features/auth/actions/{send,verify}-email-otp.ts`; the two-step UX is in
`features/auth/components/otp-flow.tsx` with a mobile-first `<OtpInput/>`
that supports `autoComplete="one-time-code"` for OS-level SMS/email autofill.

## Internationalisation

See `i18n.md` — locale resolves from `user_preferences.preferred_language`
(ADR-0017 — no URL-based routing). Namespace-scoped `useTranslations()` /
`getTranslations()` are the ONE pattern. Landing, nav, auth, dashboard header,
profile, and the top-level list headers for notes + community are fully
translated in `en` + `pa`. Feature-detail surfaces (tasks, quizzes, planner,
test evals, moderation, dialogs) still hold English strings — sweep them in
Module 13.5.

## AI Flashcards + Spaced Repetition

See `flashcards.md` — Module 28. Fourth AI feature; same
`generateStructured` pattern as quizzes. Introduces **SM-2** as a pure
function in `features/flashcards/lib/sm2.ts` — the scheduler lives in the
`reviewCard` action, no background worker (ADR-0022). Cards carry their
own SM-2 state (`ease_factor`, `interval_days`, `repetition`, `due_at`).
Two generation paths: `from topic` and `from note` (source-grounded).

## Bookmarks (unified view)

See `bookmarks.md` — Module 29. `/app/bookmarks` folds three sources into
one tabbed view: `notes.is_bookmarked`, `study_files.is_bookmarked`, and
the new `community_bookmarks` join table. Storage is split by ownership
shape — polymorphic bookmarks table was rejected (ADR-0023).

## Teacher Analytics

See `teacher-analytics.md` — Module 30. `/app/teacher` reads every metric
from existing `community_notes` columns (no new tables — ADR-0024). Scope
is the teacher's own `(board × class × medium)`. Six KPI cards + top
contributors leaderboard + last 20 moderation actions. Gated to
`profile.role === 'teacher'`.

## Community Notes

See `community.md` — the first social feature. Students share private notes
to `community_notes` (a snapshot table — ADR-0015). Teachers moderate the
pending queue. Peers see approved notes filtered by their `(board × class ×
medium)` scope. `is_teacher()` DB helper gates moderation RLS. `Progress`
nav slot swapped for `Community` — the 5-nav rule holds.

Community v2 (Module 12): **report triage** for teachers with soft-dismiss
audit trail (ADR-0016), **contributor profile** pages
(`/app/community/authors/[id]`) showing an author's approved shares scoped to
the *viewer's* board × class × medium, and a **My shared notes** section on
`/app/profile` with per-status buckets + unshare action.

## Design System

See `ui-guidelines.md`.

## Database Conventions

See `database.md`.

## Code Style Details

See `coding-standards.md`.

## Architectural Decisions

See `decisions.md` for the running ADR log.

## Workflow

Modules ship one at a time. Order: `Foundation → Auth → Dashboard shell → Profile → Exam Countdown → Daily Tasks → Notes Library → Previous Papers → Bookmarks → AI Study Planner → AI Notes Summary → AI Quiz → AI Flashcards → Community`.

For every module: **Plan → Architecture → Folder → DB → UI → Code → Self-review → Enhancement suggestions → wait for approval.**
