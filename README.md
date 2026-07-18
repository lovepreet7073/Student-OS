# StudyOS

AI-powered student learning platform. Built to scale to 100,000+ students.

## Stack

- **Next.js 15** (App Router, RSC-first, Turbopack dev)
- **TypeScript** strict
- **Tailwind CSS v4** + **shadcn/ui** + **Geist** font
- **Supabase** — Postgres, Auth, Storage (RLS on every table)
- **Gemini** for AI features
- **pnpm** as package manager

## Prerequisites

- Node.js `>=20.11.0`
- pnpm `>=9`
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local dev)
- Docker Desktop (Supabase CLI uses it under the hood)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Start Supabase locally (Postgres, Auth, Storage, Studio)
supabase start

# 4. Apply migrations
supabase db reset

# 5. Generate typed Database schema
pnpm db:types

# 6. Run the dev server
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Supabase Studio (local): [http://localhost:54323](http://localhost:54323)

## Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Next.js dev server with Turbopack         |
| `pnpm build`        | Production build                          |
| `pnpm start`        | Serve production build                    |
| `pnpm lint`         | ESLint (Next.js core-web-vitals + custom) |
| `pnpm typecheck`    | `tsc --noEmit`                            |
| `pnpm format`       | Prettier write                            |
| `pnpm format:check` | Prettier check (CI-safe)                  |
| `pnpm db:types`     | Regenerate `types/database.ts`            |
| `pnpm db:reset`     | Reset local DB + reapply migrations       |
| `pnpm db:push`      | Push migrations to remote Supabase        |

## Project structure

```
study-os/
├── .claude/                 # Project constitution — read before writing code
├── app/                     # Next.js App Router (thin route shells)
├── features/                # Feature-first business code (auth, notes, ...)
├── components/
│   ├── ui/                  # shadcn primitives (Button, Input, ...)
│   ├── layout/              # AppShell, Sidebar, Topbar, ThemeProvider
│   └── shared/              # EmptyState, ErrorState, PageHeader, ...
├── lib/
│   ├── supabase/            # server / client / middleware factories
│   ├── gemini/              # AI client + typed prompts
│   ├── env.ts               # Zod-validated env
│   └── result.ts            # typed Result<T, E>
├── types/                   # cross-cutting types (Database, DTO)
├── supabase/                # migrations + local CLI config
└── middleware.ts            # Supabase session refresh + auth guard
```

## Project rules

Every module follows the constitution in [.claude/CLAUDE.md](./.claude/CLAUDE.md). Read it
before contributing. TL;DR:

- Server Components + Server Actions first.
- Design tokens only — never hardcode colors, spacing, or radius.
- 300-line file cap.
- RLS on every table.
- `Result<T, E>` return type on every Server Action.
