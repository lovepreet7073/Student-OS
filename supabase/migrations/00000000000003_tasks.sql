-- Daily Tasks
--
-- Tasks scope by (board, class, medium) like every other content feature, but
-- subject_id is NULLABLE — some tasks aren't subject-specific ("Prep for
-- tomorrow's parent-teacher meeting"). Presence of `completed_at` = "done"
-- (allows knowing WHEN it was done, not just IF).

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id)      on delete cascade,
  board_id     uuid not null references public.boards(id)   on delete restrict,
  class_id     uuid not null references public.classes(id)  on delete restrict,
  medium_id    uuid not null references public.mediums(id)  on delete restrict,
  subject_id   uuid          references public.subjects(id) on delete set null,
  title        text not null,
  notes        text,
  due_date     date,
  completed_at timestamptz,
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint tasks_title_check check (char_length(trim(title)) between 1 and 200),
  constraint tasks_notes_len   check (notes is null or char_length(notes) <= 5000)
);

-- Every list path filters by user_id + completion state, then orders by
-- due_date and updated_at. Cover the two most common patterns explicitly.
create index if not exists tasks_user_active_idx
  on public.tasks(user_id, due_date nulls last, created_at desc)
  where completed_at is null;

create index if not exists tasks_user_done_idx
  on public.tasks(user_id, completed_at desc)
  where completed_at is not null;

create index if not exists tasks_user_subject_idx
  on public.tasks(user_id, subject_id, due_date nulls last)
  where completed_at is null;

alter table public.tasks enable row level security;

drop policy if exists "users read own tasks"   on public.tasks;
drop policy if exists "users insert own tasks" on public.tasks;
drop policy if exists "users update own tasks" on public.tasks;
drop policy if exists "users delete own tasks" on public.tasks;

create policy "users read own tasks"
  on public.tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own tasks"
  on public.tasks for update
  to authenticated
  using (auth.uid() = user_id);

create policy "users delete own tasks"
  on public.tasks for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
