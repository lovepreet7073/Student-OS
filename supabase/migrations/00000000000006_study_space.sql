-- My Study Space
--
-- Private per-user library of PDFs and images, organized by subject and
-- optional user-created "chapters" within each subject. Files live in a
-- private Storage bucket; DB rows are the metadata index.
--
-- Storage path convention:  {user_id}/{file_id}.{ext}
-- Storage RLS enforces the first path segment matches auth.uid().

-- ---------------------------------------------------------------------------
-- chapters — user-owned folders within a subject
-- ---------------------------------------------------------------------------
create table if not exists public.chapters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id)     on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chapters_name_check check (char_length(trim(name)) between 1 and 80)
);

create index if not exists chapters_user_subject_idx
  on public.chapters(user_id, subject_id, sort_order);

alter table public.chapters enable row level security;

drop policy if exists "users read own chapters"   on public.chapters;
drop policy if exists "users insert own chapters" on public.chapters;
drop policy if exists "users update own chapters" on public.chapters;
drop policy if exists "users delete own chapters" on public.chapters;

create policy "users read own chapters"   on public.chapters for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own chapters" on public.chapters for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own chapters" on public.chapters for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own chapters" on public.chapters for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists chapters_set_updated_at on public.chapters;
create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- study_files — metadata for each uploaded file
-- ---------------------------------------------------------------------------
create table if not exists public.study_files (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id)      on delete cascade,
  board_id      uuid not null references public.boards(id)   on delete restrict,
  class_id      uuid not null references public.classes(id)  on delete restrict,
  medium_id     uuid not null references public.mediums(id)  on delete restrict,
  subject_id    uuid not null references public.subjects(id) on delete restrict,
  chapter_id    uuid          references public.chapters(id) on delete set null,
  file_name     text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  storage_path  text not null unique,
  description   text,
  is_bookmarked boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint study_files_name_check check (char_length(trim(file_name)) between 1 and 255),
  constraint study_files_size_check check (size_bytes > 0 and size_bytes <= 26214400),
  constraint study_files_mime_check check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  constraint study_files_desc_len  check (description is null or char_length(description) <= 500)
);

create index if not exists study_files_user_updated_idx
  on public.study_files(user_id, updated_at desc);

create index if not exists study_files_user_scope_idx
  on public.study_files(user_id, subject_id, chapter_id, updated_at desc);

create index if not exists study_files_user_bookmarked_idx
  on public.study_files(user_id, updated_at desc)
  where is_bookmarked = true;

alter table public.study_files enable row level security;

drop policy if exists "users read own study_files"   on public.study_files;
drop policy if exists "users insert own study_files" on public.study_files;
drop policy if exists "users update own study_files" on public.study_files;
drop policy if exists "users delete own study_files" on public.study_files;

create policy "users read own study_files"   on public.study_files for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own study_files" on public.study_files for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own study_files" on public.study_files for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own study_files" on public.study_files for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists study_files_set_updated_at on public.study_files;
create trigger study_files_set_updated_at
  before update on public.study_files
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket + RLS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-files',
  'study-files',
  false,
  26214400,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public             = excluded.public;

drop policy if exists "users read own study-files objects"   on storage.objects;
drop policy if exists "users insert own study-files objects" on storage.objects;
drop policy if exists "users update own study-files objects" on storage.objects;
drop policy if exists "users delete own study-files objects" on storage.objects;

create policy "users read own study-files objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'study-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users insert own study-files objects"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'study-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own study-files objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'study-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own study-files objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'study-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
