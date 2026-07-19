-- Workspace activity events (Module 15)
--
-- One row per meaningful interaction — opens, uploads, creations. Powers
-- "Recently opened" and "Recently uploaded" on `/app/workspace`.
--
-- Denormalised `title` lets us render the feed without a join per entity type
-- (notes / files / tasks / quizzes / plans / evaluations / community_notes).
-- If the source is deleted, the event row survives — showing a strikethrough
-- "Deleted note" is better UX than a null cascade.

create table if not exists public.activity_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  entity_type  text not null check (entity_type in (
    'note', 'file', 'task', 'quiz', 'study_plan',
    'test_evaluation', 'community_note'
  )),
  entity_id    uuid not null,
  action       text not null check (action in ('opened', 'uploaded', 'created')),
  title        text not null default '',
  created_at   timestamptz not null default now()
);

-- Feed queries: latest events per user + type filter.
create index if not exists activity_events_user_created_idx
  on public.activity_events(user_id, created_at desc);

create index if not exists activity_events_user_action_created_idx
  on public.activity_events(user_id, action, created_at desc);

-- Dedupe helper: one "opened" per user per entity per day. We can't use
-- `(created_at::date)` in an index expression because that cast is STABLE,
-- not IMMUTABLE (it depends on the session's TimeZone). Postgres refuses.
--
-- Fix: add a generated column `opened_day` whose expression only references
-- `created_at`, and index that. `date_trunc('day', ..., 'UTC')` — the 3-arg
-- form fixed to a specific zone — IS immutable, so it can back the index.
alter table public.activity_events
  add column if not exists opened_day date generated always as (
    (date_trunc('day', created_at at time zone 'UTC'))::date
  ) stored;

create unique index if not exists activity_events_open_dedupe_idx
  on public.activity_events(user_id, entity_type, entity_id, opened_day)
  where action = 'opened';

alter table public.activity_events enable row level security;

drop policy if exists "activity_events select" on public.activity_events;
drop policy if exists "activity_events insert" on public.activity_events;
drop policy if exists "activity_events delete" on public.activity_events;

create policy "activity_events select"
  on public.activity_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "activity_events insert"
  on public.activity_events for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "activity_events delete"
  on public.activity_events for delete
  to authenticated
  using (auth.uid() = user_id);
