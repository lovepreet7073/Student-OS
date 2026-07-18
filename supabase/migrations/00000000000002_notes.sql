-- Notes Library
--
-- A note belongs to a user AND is scoped to (board, class, medium, subject).
-- Every list query filters by the user's academic scope, matching how the
-- Academic Identity System personalizes content across the app.

create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id)      on delete cascade,
  board_id      uuid not null references public.boards(id)   on delete restrict,
  class_id      uuid not null references public.classes(id)  on delete restrict,
  medium_id     uuid not null references public.mediums(id)  on delete restrict,
  subject_id    uuid not null references public.subjects(id) on delete restrict,
  title         text not null,
  content       text not null default '',
  is_bookmarked boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint notes_title_not_empty check (char_length(trim(title)) between 1 and 200),
  constraint notes_content_len     check (char_length(content) <= 50000)
);

-- Every list path filters by user_id + (subject_id | is_bookmarked) + updated_at.
create index if not exists notes_user_updated_idx
  on public.notes(user_id, updated_at desc);

create index if not exists notes_user_subject_updated_idx
  on public.notes(user_id, subject_id, updated_at desc);

create index if not exists notes_user_bookmarked_idx
  on public.notes(user_id, updated_at desc)
  where is_bookmarked = true;

-- Full-text search index — sits ready for a later switch from ILIKE to
-- `to_tsvector` when the notes table grows past ~10k rows.
create index if not exists notes_search_idx
  on public.notes
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));

alter table public.notes enable row level security;

drop policy if exists "users read own notes"   on public.notes;
drop policy if exists "users insert own notes" on public.notes;
drop policy if exists "users update own notes" on public.notes;
drop policy if exists "users delete own notes" on public.notes;

create policy "users read own notes"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own notes"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own notes"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id);

create policy "users delete own notes"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();
