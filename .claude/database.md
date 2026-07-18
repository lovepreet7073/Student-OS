# Database Conventions

## Baseline for every table

```sql
create table public.example (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- ... domain columns ...
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index example_user_id_idx on public.example(user_id);
create index example_created_at_idx on public.example(created_at desc);

alter table public.example enable row level security;

create policy "users read own"    on public.example for select using (auth.uid() = user_id);
create policy "users insert own"  on public.example for insert with check (auth.uid() = user_id);
create policy "users update own"  on public.example for update using (auth.uid() = user_id);
create policy "users delete own"  on public.example for delete using (auth.uid() = user_id);

create trigger example_set_updated_at
  before update on public.example
  for each row execute function public.set_updated_at();
```

## Rules

1. **RLS ON, ALWAYS.** A migration that creates a table without RLS is a bug.
2. **Snake_case** for table and column names.
3. **Singular vs plural?** — Plural table names (`notes`, not `note`).
4. **Foreign keys** always have `on delete` behavior specified.
5. **Indexes** on every FK, every column used in a `where`, every `order by` column that runs
   without a limit.
6. **Timestamps** are `timestamptz` — never `timestamp`.
7. **Enums** — prefer Postgres enums for closed sets; text with a `check` constraint for
   fast-iterating values.
8. **Money** — `numeric(12,2)`. Never `float`.
9. **JSON** — `jsonb`, never `json`.
10. **Migrations** live in `supabase/migrations/` with `YYYYMMDDHHMMSS_description.sql` naming.

## Shared helpers

Migration `00000000000000_init.sql` (Foundation module) creates:

- `public.set_updated_at()` — trigger function that sets `updated_at = now()`.
- `public.profiles` — extends `auth.users` with domain fields (`display_name`, `avatar_url`,
  `exam_target_date`, ...). Created via a trigger on `auth.users` insert.

## Types

After schema changes: `pnpm db:types` regenerates `types/database.ts`. Commit it.

Then in code:

```ts
import type { Database } from "@/types/database";

type Note = Database["public"]["Tables"]["notes"]["Row"];
```

## Never do this

- ❌ Store denormalized copies "for speed" (measure first, then decide).
- ❌ Rely on the client for RLS — assume any request could be malicious.
- ❌ Use `service_role` outside of trusted server contexts (never in Server Actions unless
  strictly necessary; never on the client).
- ❌ Use `select *` in Server Actions — enumerate columns for typed narrow reads.
