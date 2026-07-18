-- AI Quizzes
--
-- One quiz = one Gemini generation. Retakes = new quizzes. Simplifies the
-- data model dramatically vs a "multiple attempts per quiz" schema.
--
-- Design choices:
--   - user_id denormalized on quiz_questions + quiz_answers → trivial RLS
--   - raw_gemini_response jsonb → invaluable for prompt debugging; prune later
--   - question_types text[] rather than a join table → reads like a set, no join
--   - self_marked_correct → short-answer questions can't be auto-graded

create table if not exists public.quizzes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  board_id              uuid not null references public.boards(id)   on delete restrict,
  class_id              uuid not null references public.classes(id)  on delete restrict,
  medium_id             uuid not null references public.mediums(id)  on delete restrict,
  subject_id            uuid not null references public.subjects(id) on delete restrict,
  topic                 text not null,
  question_types        text[] not null,
  total_questions       integer not null,
  correct_count         integer,
  completed_at          timestamptz,
  raw_gemini_response   jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint quizzes_topic_check      check (char_length(trim(topic)) between 1 and 200),
  constraint quizzes_count_check      check (total_questions between 1 and 25),
  constraint quizzes_correct_check    check (correct_count is null or correct_count between 0 and total_questions)
);

create index if not exists quizzes_user_created_idx
  on public.quizzes(user_id, created_at desc);

create index if not exists quizzes_user_subject_idx
  on public.quizzes(user_id, subject_id, created_at desc);

create table if not exists public.quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references public.quizzes(id) on delete cascade,
  user_id        uuid not null,
  ordinal        integer not null,
  type           text not null,
  question       text not null,
  options        jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation    text not null default '',
  created_at     timestamptz not null default now(),

  constraint quiz_questions_type_check
    check (type in ('mcq', 'true_false', 'fill_blank', 'short_answer')),
  constraint quiz_questions_ordinal_unique unique (quiz_id, ordinal)
);

create index if not exists quiz_questions_quiz_idx
  on public.quiz_questions(quiz_id, ordinal);

create table if not exists public.quiz_answers (
  id                   uuid primary key default gen_random_uuid(),
  quiz_id              uuid not null references public.quizzes(id) on delete cascade,
  question_id          uuid not null references public.quiz_questions(id) on delete cascade,
  user_id              uuid not null,
  user_answer          text not null default '',
  is_correct           boolean,
  self_marked_correct  boolean,
  answered_at          timestamptz not null default now(),

  constraint quiz_answers_unique unique (quiz_id, question_id)
);

create index if not exists quiz_answers_quiz_idx
  on public.quiz_answers(quiz_id);

-- RLS
alter table public.quizzes         enable row level security;
alter table public.quiz_questions  enable row level security;
alter table public.quiz_answers    enable row level security;

drop policy if exists "users read own quizzes"   on public.quizzes;
drop policy if exists "users insert own quizzes" on public.quizzes;
drop policy if exists "users update own quizzes" on public.quizzes;
drop policy if exists "users delete own quizzes" on public.quizzes;

create policy "users read own quizzes"   on public.quizzes for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own quizzes" on public.quizzes for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own quizzes" on public.quizzes for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own quizzes" on public.quizzes for delete
  to authenticated using (auth.uid() = user_id);

drop policy if exists "users read own quiz_questions"   on public.quiz_questions;
drop policy if exists "users insert own quiz_questions" on public.quiz_questions;
drop policy if exists "users delete own quiz_questions" on public.quiz_questions;

create policy "users read own quiz_questions"   on public.quiz_questions for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own quiz_questions" on public.quiz_questions for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users delete own quiz_questions" on public.quiz_questions for delete
  to authenticated using (auth.uid() = user_id);

drop policy if exists "users read own quiz_answers"   on public.quiz_answers;
drop policy if exists "users insert own quiz_answers" on public.quiz_answers;
drop policy if exists "users update own quiz_answers" on public.quiz_answers;
drop policy if exists "users delete own quiz_answers" on public.quiz_answers;

create policy "users read own quiz_answers"   on public.quiz_answers for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own quiz_answers" on public.quiz_answers for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own quiz_answers" on public.quiz_answers for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own quiz_answers" on public.quiz_answers for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();
