# Architecture

## Layering

```
┌─────────────────────────────────────────────────────────────┐
│  app/           thin route shells (RSC by default)          │
│                 compose from features + components          │
├─────────────────────────────────────────────────────────────┤
│  features/{X}/  business logic per feature                  │
│    ├─ components/   RSC + client islands                    │
│    ├─ actions/      Server Actions (validated with Zod)     │
│    ├─ hooks/        client-side hooks                       │
│    ├─ schemas/      Zod schemas — shared between actions/UI │
│    └─ types/        feature-scoped types                    │
├─────────────────────────────────────────────────────────────┤
│  components/    cross-feature UI                            │
│    ├─ ui/       shadcn primitives (Button, Input, ...)      │
│    ├─ layout/   AppShell, Sidebar, Topbar, ThemeProvider    │
│    └─ shared/   EmptyState, ErrorState, PageHeader, ...     │
├─────────────────────────────────────────────────────────────┤
│  lib/           low-level, framework-adjacent               │
│    ├─ supabase/ server/client/middleware factories          │
│    ├─ gemini/   AI client + typed prompt templates          │
│    ├─ utils/    cn, formatDate, ...                         │
│    ├─ result.ts typed Result<T, E> helper                   │
│    └─ env.ts    Zod-validated env                           │
├─────────────────────────────────────────────────────────────┤
│  types/         cross-cutting types (Database, DTO)         │
│  hooks/         cross-feature hooks (useMediaQuery, ...)    │
│  middleware.ts  Supabase session refresh + auth guard       │
└─────────────────────────────────────────────────────────────┘
```

## Dependency direction (one-way, top → bottom)

```
app  ─►  features  ─►  components/ui, components/shared, lib, hooks, types
                                    │
                                    └►  lib, types
```

Features **must not** import from other features. If two features need to share code, promote
that code to `components/shared`, `lib/`, or `hooks/`.

## Server / Client boundary

- Default to **Server Components**. Add `"use client"` only when you need state, effects,
  refs, browser APIs, or event handlers.
- Data fetching happens in RSC. Mutations happen in Server Actions.
- Client components receive data via props from their parent RSC.
- API routes are reserved for webhooks and streaming — everything else is a Server Action.

## Route groups

- `app/(auth)/` — public marketing/auth pages (login, signup, forgot password). No dashboard chrome.
- `app/(app)/` — protected app shell (sidebar + topbar). Middleware ensures a session exists.

## Error handling

- Every Server Action returns a `Result<T, ActionError>` (see `lib/result.ts`) — never throws
  to the client.
- `app/error.tsx` and `app/(app)/error.tsx` catch RSC errors and show a recoverable state.
- Client mutations surface errors via `sonner` toasts.

## Rendering strategy

- Auth pages: static prerender.
- Dashboard shell: dynamic (uses cookies).
- Content pages (notes, papers): cached with `revalidateTag` invalidation from Server Actions.
