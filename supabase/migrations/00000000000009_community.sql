-- Community Notes (Module 11)
--
-- A student can share a private note to the community. The row lands in
-- `community_notes` with status='pending' and is invisible to peers until a
-- teacher approves it. Every table is scoped by (board, class, medium,
-- subject) so peers only see notes relevant to their own syllabus.
--
-- The row is a *snapshot* — `content` is copied on share so the community
-- version doesn't change if the author later edits the source note.
-- `source_note_id` is nullable and ON DELETE SET NULL so deleting the source
-- doesn't cascade the community copy.

-- Helper: is the authed user a teacher?
create or replace function public.is_teacher(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_preferences
    where user_id = uid and user_role = 'teacher'
  );
$$;

grant execute on function public.is_teacher(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- community_notes
-- ---------------------------------------------------------------------------
create table if not exists public.community_notes (
  id                uuid primary key default gen_random_uuid(),
  source_note_id    uuid references public.notes(id) on delete set null,
  author_id         uuid not null references auth.users(id)      on delete cascade,
  board_id          uuid not null references public.boards(id)   on delete restrict,
  class_id          uuid not null references public.classes(id)  on delete restrict,
  medium_id         uuid not null references public.mediums(id)  on delete restrict,
  subject_id        uuid not null references public.subjects(id) on delete restrict,
  author_display_name text not null default '',
  title             text not null,
  content           text not null default '',
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason  text,
  moderated_by      uuid references auth.users(id) on delete set null,
  moderated_at      timestamptz,
  likes_count       integer not null default 0 check (likes_count >= 0),
  bookmarks_count   integer not null default 0 check (bookmarks_count >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint community_notes_title_not_empty
    check (char_length(trim(title)) between 1 and 200),
  constraint community_notes_content_len
    check (char_length(content) <= 50000)
);

-- Approved feed: scope-filter + recency.
create index if not exists community_notes_feed_idx
  on public.community_notes(board_id, class_id, medium_id, subject_id, created_at desc)
  where status = 'approved';

-- Moderation queue: pending items by scope, oldest first (FIFO).
create index if not exists community_notes_pending_idx
  on public.community_notes(board_id, class_id, medium_id, created_at asc)
  where status = 'pending';

create index if not exists community_notes_author_idx
  on public.community_notes(author_id, created_at desc);

alter table public.community_notes enable row level security;

drop policy if exists "community_notes select"  on public.community_notes;
drop policy if exists "community_notes insert"  on public.community_notes;
drop policy if exists "community_notes update"  on public.community_notes;
drop policy if exists "community_notes delete"  on public.community_notes;

-- Anyone can see approved notes; author sees their own; teachers see all.
create policy "community_notes select"
  on public.community_notes for select
  to authenticated
  using (
    status = 'approved'
    or auth.uid() = author_id
    or public.is_teacher(auth.uid())
  );

-- Only the author can share, and only as pending.
create policy "community_notes insert"
  on public.community_notes for insert
  to authenticated
  with check (auth.uid() = author_id and status = 'pending');

-- Teachers moderate; authors cannot edit content once shared.
create policy "community_notes update"
  on public.community_notes for update
  to authenticated
  using (public.is_teacher(auth.uid()));

create policy "community_notes delete"
  on public.community_notes for delete
  to authenticated
  using (auth.uid() = author_id);

drop trigger if exists community_notes_set_updated_at on public.community_notes;
create trigger community_notes_set_updated_at
  before update on public.community_notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_likes  (composite PK — no duplicates possible)
-- ---------------------------------------------------------------------------
create table if not exists public.community_likes (
  community_note_id uuid not null references public.community_notes(id) on delete cascade,
  user_id           uuid not null references auth.users(id)             on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (community_note_id, user_id)
);

create index if not exists community_likes_user_idx
  on public.community_likes(user_id, created_at desc);

alter table public.community_likes enable row level security;

drop policy if exists "community_likes select" on public.community_likes;
drop policy if exists "community_likes insert" on public.community_likes;
drop policy if exists "community_likes delete" on public.community_likes;

create policy "community_likes select"
  on public.community_likes for select
  to authenticated using (true);

create policy "community_likes insert"
  on public.community_likes for insert
  to authenticated with check (auth.uid() = user_id);

create policy "community_likes delete"
  on public.community_likes for delete
  to authenticated using (auth.uid() = user_id);

-- Denormalized counter — trigger keeps it in sync.
create or replace function public.tick_community_likes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_notes
      set likes_count = likes_count + 1
      where id = new.community_note_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_notes
      set likes_count = greatest(likes_count - 1, 0)
      where id = old.community_note_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_likes_tick on public.community_likes;
create trigger community_likes_tick
  after insert or delete on public.community_likes
  for each row execute function public.tick_community_likes();

-- ---------------------------------------------------------------------------
-- community_bookmarks (same shape as likes)
-- ---------------------------------------------------------------------------
create table if not exists public.community_bookmarks (
  community_note_id uuid not null references public.community_notes(id) on delete cascade,
  user_id           uuid not null references auth.users(id)             on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (community_note_id, user_id)
);

create index if not exists community_bookmarks_user_idx
  on public.community_bookmarks(user_id, created_at desc);

alter table public.community_bookmarks enable row level security;

drop policy if exists "community_bookmarks select" on public.community_bookmarks;
drop policy if exists "community_bookmarks insert" on public.community_bookmarks;
drop policy if exists "community_bookmarks delete" on public.community_bookmarks;

create policy "community_bookmarks select"
  on public.community_bookmarks for select
  to authenticated using (auth.uid() = user_id);

create policy "community_bookmarks insert"
  on public.community_bookmarks for insert
  to authenticated with check (auth.uid() = user_id);

create policy "community_bookmarks delete"
  on public.community_bookmarks for delete
  to authenticated using (auth.uid() = user_id);

create or replace function public.tick_community_bookmarks()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_notes
      set bookmarks_count = bookmarks_count + 1
      where id = new.community_note_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_notes
      set bookmarks_count = greatest(bookmarks_count - 1, 0)
      where id = old.community_note_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_bookmarks_tick on public.community_bookmarks;
create trigger community_bookmarks_tick
  after insert or delete on public.community_bookmarks
  for each row execute function public.tick_community_bookmarks();

-- ---------------------------------------------------------------------------
-- community_reports
-- ---------------------------------------------------------------------------
create table if not exists public.community_reports (
  id                uuid primary key default gen_random_uuid(),
  community_note_id uuid not null references public.community_notes(id) on delete cascade,
  user_id           uuid not null references auth.users(id)             on delete cascade,
  reason            text not null check (char_length(trim(reason)) between 1 and 500),
  created_at        timestamptz not null default now(),
  unique (community_note_id, user_id)
);

create index if not exists community_reports_note_idx
  on public.community_reports(community_note_id, created_at desc);

alter table public.community_reports enable row level security;

drop policy if exists "community_reports select" on public.community_reports;
drop policy if exists "community_reports insert" on public.community_reports;

-- Reporters see their own; teachers see all (for moderation triage).
create policy "community_reports select"
  on public.community_reports for select
  to authenticated
  using (auth.uid() = user_id or public.is_teacher(auth.uid()));

create policy "community_reports insert"
  on public.community_reports for insert
  to authenticated
  with check (auth.uid() = user_id);
