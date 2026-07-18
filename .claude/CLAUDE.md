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
