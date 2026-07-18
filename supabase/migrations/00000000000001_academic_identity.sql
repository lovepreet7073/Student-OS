-- Academic Identity System
--
-- Reference tables (public read):
--   boards, mediums, classes, subjects
-- User tables (own row read/write):
--   user_preferences, user_subjects
--
-- All tables have RLS enabled. Reference tables allow read of active rows to
-- any authenticated user. User tables are per-user via auth.uid().

-- ---------------------------------------------------------------------------
-- boards
-- ---------------------------------------------------------------------------
create table if not exists public.boards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text not null,
  slug        text not null unique,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists boards_active_idx
  on public.boards(is_active, sort_order) where is_active = true;

alter table public.boards enable row level security;

drop policy if exists "authenticated read active boards" on public.boards;
create policy "authenticated read active boards"
  on public.boards for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- mediums
-- ---------------------------------------------------------------------------
create table if not exists public.mediums (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  native_name text,
  locale      text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists mediums_active_idx
  on public.mediums(is_active, sort_order) where is_active = true;

alter table public.mediums enable row level security;

drop policy if exists "authenticated read active mediums" on public.mediums;
create policy "authenticated read active mediums"
  on public.mediums for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists classes_active_idx
  on public.classes(is_active, sort_order) where is_active = true;

alter table public.classes enable row level security;

drop policy if exists "authenticated read active classes" on public.classes;
create policy "authenticated read active classes"
  on public.classes for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id)  on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  medium_id   uuid not null references public.mediums(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (board_id, class_id, medium_id, slug)
);

create index if not exists subjects_scope_idx
  on public.subjects(board_id, class_id, medium_id) where is_active = true;

alter table public.subjects enable row level security;

drop policy if exists "authenticated read active subjects" on public.subjects;
create policy "authenticated read active subjects"
  on public.subjects for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- user_preferences (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.user_preferences (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users(id) on delete cascade,
  board_id           uuid not null references public.boards(id),
  medium_id          uuid not null references public.mediums(id),
  class_id           uuid not null references public.classes(id),
  preferred_language text not null default 'en',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint user_preferences_language_len check (char_length(preferred_language) between 2 and 8)
);

create index if not exists user_preferences_user_idx on public.user_preferences(user_id);

alter table public.user_preferences enable row level security;

drop policy if exists "users read own preferences"   on public.user_preferences;
drop policy if exists "users insert own preferences" on public.user_preferences;
drop policy if exists "users update own preferences" on public.user_preferences;

create policy "users read own preferences"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own preferences"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own preferences"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_subjects (N:M user ↔ subject)
-- ---------------------------------------------------------------------------
create table if not exists public.user_subjects (
  user_id    uuid not null references auth.users(id)     on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

create index if not exists user_subjects_user_idx    on public.user_subjects(user_id);
create index if not exists user_subjects_subject_idx on public.user_subjects(subject_id);

alter table public.user_subjects enable row level security;

drop policy if exists "users read own subjects"   on public.user_subjects;
drop policy if exists "users insert own subjects" on public.user_subjects;
drop policy if exists "users delete own subjects" on public.user_subjects;

create policy "users read own subjects"
  on public.user_subjects for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert own subjects"
  on public.user_subjects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users delete own subjects"
  on public.user_subjects for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed reference data — idempotent
-- ---------------------------------------------------------------------------

insert into public.boards (name, short_name, slug, sort_order) values
  ('Central Board of Secondary Education',                'CBSE', 'cbse', 1),
  ('Council for the Indian School Certificate Examinations', 'ICSE', 'icse', 2),
  ('Punjab School Education Board',                       'PSEB', 'pseb', 3),
  ('Haryana Board of School Education',                   'HBSE', 'hbse', 4),
  ('Rajasthan Board of Secondary Education',              'RBSE', 'rbse', 5)
on conflict (slug) do nothing;

insert into public.mediums (name, slug, native_name, locale, sort_order) values
  ('English', 'english', 'English',   'en', 1),
  ('Hindi',   'hindi',   'हिन्दी',      'hi', 2),
  ('Punjabi', 'punjabi', 'ਪੰਜਾਬੀ',      'pa', 3)
on conflict (slug) do nothing;

insert into public.classes (name, sort_order) values
  ('6',  6), ('7',  7), ('8',  8), ('9',  9),
  ('10', 10), ('11', 11), ('12', 12)
on conflict (name) do nothing;

-- Subjects seed — cross-join helper pattern
-- Adds subjects for a given (board_slug, class_name, medium_slug) combination.
-- Repeat the block for each combo you want to seed.

insert into public.subjects (board_id, class_id, medium_id, name, slug, sort_order)
select b.id, c.id, m.id, s.name, s.slug, s.sort_order
from public.boards   b
cross join public.classes c
cross join public.mediums m
cross join (values
  ('English',        'english',        1),
  ('Punjabi',        'punjabi',        2),
  ('Hindi',          'hindi',          3),
  ('Mathematics',    'mathematics',    4),
  ('Science',        'science',        5),
  ('Social Studies', 'social-studies', 6),
  ('Computer Science','computer-science', 7)
) as s(name, slug, sort_order)
where b.slug = 'pseb' and c.name = '10' and m.slug in ('english','punjabi')
on conflict (board_id, class_id, medium_id, slug) do nothing;

insert into public.subjects (board_id, class_id, medium_id, name, slug, sort_order)
select b.id, c.id, m.id, s.name, s.slug, s.sort_order
from public.boards   b
cross join public.classes c
cross join public.mediums m
cross join (values
  ('English',              'english',              1),
  ('Hindi',                'hindi',                2),
  ('Mathematics',          'mathematics',          3),
  ('Science',              'science',              4),
  ('Social Science',       'social-science',       5),
  ('Sanskrit',             'sanskrit',             6),
  ('Computer Applications','computer-applications',7)
) as s(name, slug, sort_order)
where b.slug = 'cbse' and c.name = '10' and m.slug in ('english','hindi')
on conflict (board_id, class_id, medium_id, slug) do nothing;
