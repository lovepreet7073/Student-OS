-- Community bookmarks (Module 29)
--
-- Notes and study_files already carry `is_bookmarked` because each row has a
-- single owner — the bookmark is 1:1 with the user who owns it. Community
-- notes are different: one row can be bookmarked by many peers. That forces
-- a join table.
--
-- `community_bookmarks` is minimal: (user_id, community_note_id, created_at).
-- The primary key doubles as the uniqueness guarantee — a user can only
-- bookmark a given note once. Deleting the note cascades. Deleting the user
-- cascades.

create table if not exists public.community_bookmarks (
  user_id           uuid not null references auth.users(id) on delete cascade,
  community_note_id uuid not null references public.community_notes(id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (user_id, community_note_id)
);

-- Index for the "list my community bookmarks" query: newest first per user.
create index if not exists community_bookmarks_user_created_idx
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
