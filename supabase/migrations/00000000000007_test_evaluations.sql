-- AI Test Evaluation
--
-- Student uploads handwritten pages / PDF of an attempted test → Gemini
-- Vision reads the pages, grades against expected answers at the student's
-- class level, returns a structured report. Report persists as history.
--
-- Status lifecycle: pending → evaluating → completed | failed
-- (retry on failed: reset to pending → resubmit).

create table if not exists public.test_evaluations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id)      on delete cascade,
  board_id            uuid not null references public.boards(id)   on delete restrict,
  class_id            uuid not null references public.classes(id)  on delete restrict,
  medium_id           uuid not null references public.mediums(id)  on delete restrict,
  subject_id          uuid not null references public.subjects(id) on delete restrict,
  title               text not null,
  exam_type           text not null,
  max_marks           integer not null,
  topics              text,
  status              text not null default 'pending',
  ai_score            numeric(6, 2),
  ai_percentage       numeric(5, 2),
  ai_grade            text,
  ai_summary          text,
  answers             jsonb,               -- array of { question_number, ..., feedback, missing_points[], strengths[] }
  recommended_topics  jsonb,               -- array of strings
  raw_gemini_response jsonb,
  error_message       text,
  evaluated_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint test_evaluations_title_check     check (char_length(trim(title)) between 1 and 200),
  constraint test_evaluations_type_check      check (exam_type in ('unit_test', 'chapter_test', 'board_model', 'practice', 'other')),
  constraint test_evaluations_marks_check     check (max_marks between 1 and 500),
  constraint test_evaluations_status_check    check (status in ('pending', 'evaluating', 'completed', 'failed')),
  constraint test_evaluations_score_check     check (ai_score is null or (ai_score >= 0 and ai_score <= max_marks)),
  constraint test_evaluations_pct_check       check (ai_percentage is null or (ai_percentage >= 0 and ai_percentage <= 100)),
  constraint test_evaluations_topics_len      check (topics is null or char_length(topics) <= 1000),
  constraint test_evaluations_summary_len     check (ai_summary is null or char_length(ai_summary) <= 4000)
);

create index if not exists test_evaluations_user_created_idx
  on public.test_evaluations(user_id, created_at desc);

create index if not exists test_evaluations_user_subject_idx
  on public.test_evaluations(user_id, subject_id, created_at desc);

create index if not exists test_evaluations_user_pending_idx
  on public.test_evaluations(user_id, created_at)
  where status in ('pending', 'evaluating');

alter table public.test_evaluations enable row level security;

drop policy if exists "users read own test_evaluations"   on public.test_evaluations;
drop policy if exists "users insert own test_evaluations" on public.test_evaluations;
drop policy if exists "users update own test_evaluations" on public.test_evaluations;
drop policy if exists "users delete own test_evaluations" on public.test_evaluations;

create policy "users read own test_evaluations"   on public.test_evaluations for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own test_evaluations" on public.test_evaluations for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own test_evaluations" on public.test_evaluations for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own test_evaluations" on public.test_evaluations for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists test_evaluations_set_updated_at on public.test_evaluations;
create trigger test_evaluations_set_updated_at
  before update on public.test_evaluations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- test_evaluation_pages — one row per uploaded page
-- ---------------------------------------------------------------------------
create table if not exists public.test_evaluation_pages (
  id             uuid primary key default gen_random_uuid(),
  evaluation_id  uuid not null references public.test_evaluations(id) on delete cascade,
  user_id        uuid not null,
  page_number    integer not null,
  storage_path   text not null unique,
  mime_type      text not null,
  size_bytes     bigint not null,
  created_at     timestamptz not null default now(),

  constraint test_pages_page_number_check unique (evaluation_id, page_number),
  constraint test_pages_page_range        check (page_number between 1 and 30),
  constraint test_pages_size_check        check (size_bytes > 0 and size_bytes <= 26214400),
  constraint test_pages_mime_check        check (mime_type in ('application/pdf', 'image/png', 'image/jpeg'))
);

create index if not exists test_pages_eval_idx
  on public.test_evaluation_pages(evaluation_id, page_number);

alter table public.test_evaluation_pages enable row level security;

drop policy if exists "users read own test_pages"   on public.test_evaluation_pages;
drop policy if exists "users insert own test_pages" on public.test_evaluation_pages;
drop policy if exists "users delete own test_pages" on public.test_evaluation_pages;

create policy "users read own test_pages"   on public.test_evaluation_pages for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own test_pages" on public.test_evaluation_pages for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users delete own test_pages" on public.test_evaluation_pages for delete
  to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket + RLS  (separate from study-files so lifecycle can differ)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'test-answers',
  'test-answers',
  false,
  26214400,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public             = excluded.public;

drop policy if exists "users read own test-answers objects"   on storage.objects;
drop policy if exists "users insert own test-answers objects" on storage.objects;
drop policy if exists "users update own test-answers objects" on storage.objects;
drop policy if exists "users delete own test-answers objects" on storage.objects;

create policy "users read own test-answers objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'test-answers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users insert own test-answers objects"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'test-answers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own test-answers objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'test-answers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own test-answers objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'test-answers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
