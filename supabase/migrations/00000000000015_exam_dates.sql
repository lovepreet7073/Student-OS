-- Exam Countdown (Module 26)
--
-- A student marks upcoming exam dates. The Dashboard widget shows the next
-- one with a days-until countdown; the Workspace/Dashboard "Exams" section
-- lists all upcoming ones. Past exams stay in the DB but aren't rendered.
--
-- Nothing is scope-filtered by board/class/medium — a student's exam list
-- is personal. `subject_id` is optional (some exams are cross-subject or
-- extracurricular).

create table if not exists public.exam_dates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id)    on delete cascade,
  subject_id  uuid references public.subjects(id)        on delete set null,
  name        text not null,
  exam_date   date not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint exam_dates_name_len   check (char_length(trim(name)) between 1 and 120),
  constraint exam_dates_notes_len  check (notes is null or char_length(notes) <= 500)
);

-- The critical query: next exam per user, ordered by date ascending.
create index if not exists exam_dates_user_date_idx
  on public.exam_dates(user_id, exam_date asc);

alter table public.exam_dates enable row level security;

drop policy if exists "exam_dates select" on public.exam_dates;
drop policy if exists "exam_dates insert" on public.exam_dates;
drop policy if exists "exam_dates update" on public.exam_dates;
drop policy if exists "exam_dates delete" on public.exam_dates;

create policy "exam_dates select"
  on public.exam_dates for select
  to authenticated using (auth.uid() = user_id);

create policy "exam_dates insert"
  on public.exam_dates for insert
  to authenticated with check (auth.uid() = user_id);

create policy "exam_dates update"
  on public.exam_dates for update
  to authenticated using (auth.uid() = user_id);

create policy "exam_dates delete"
  on public.exam_dates for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists exam_dates_set_updated_at on public.exam_dates;
create trigger exam_dates_set_updated_at
  before update on public.exam_dates
  for each row execute function public.set_updated_at();
