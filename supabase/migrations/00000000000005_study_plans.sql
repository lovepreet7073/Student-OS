-- AI Study Planner
--
-- A study_plan is one generation: pin its inputs (dates, hours/day, subjects,
-- goal), the raw Gemini response for debugging, and mark exactly one plan as
-- active per user at a time.
--
-- study_plan_items are the day-by-day sessions. One row per session,
-- ordered within a day by `ordinal`.

create table if not exists public.study_plans (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id)      on delete cascade,
  board_id               uuid not null references public.boards(id)   on delete restrict,
  class_id               uuid not null references public.classes(id)  on delete restrict,
  medium_id              uuid not null references public.mediums(id)  on delete restrict,
  title                  text not null,
  goal                   text,
  start_date             date not null,
  end_date               date not null,
  daily_hours            integer not null,
  focus_subject_ids      uuid[] not null default '{}',
  is_active              boolean not null default true,
  raw_gemini_response    jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint study_plans_title_check       check (char_length(trim(title)) between 1 and 120),
  constraint study_plans_goal_len          check (goal is null or char_length(goal) <= 500),
  constraint study_plans_dates_check       check (end_date >= start_date),
  constraint study_plans_hours_check       check (daily_hours between 1 and 10),
  constraint study_plans_span_check        check (end_date - start_date <= 60)
);

create index if not exists study_plans_user_created_idx
  on public.study_plans(user_id, created_at desc);

create unique index if not exists study_plans_one_active_per_user_idx
  on public.study_plans(user_id) where is_active = true;

create table if not exists public.study_plan_items (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references public.study_plans(id) on delete cascade,
  user_id           uuid not null,
  plan_date         date not null,
  ordinal           integer not null,
  subject_id        uuid references public.subjects(id) on delete set null,
  subject_name      text not null,  -- persisted so a subject rename/retire doesn't destroy the plan
  topic             text not null,
  duration_minutes  integer not null,
  notes             text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),

  constraint study_plan_items_topic_check     check (char_length(trim(topic)) between 1 and 200),
  constraint study_plan_items_duration_check  check (duration_minutes between 5 and 240),
  constraint study_plan_items_notes_len       check (notes is null or char_length(notes) <= 1000),
  constraint study_plan_items_ordinal_unique  unique (plan_id, plan_date, ordinal)
);

create index if not exists study_plan_items_user_date_idx
  on public.study_plan_items(user_id, plan_date, ordinal);

create index if not exists study_plan_items_plan_date_idx
  on public.study_plan_items(plan_id, plan_date, ordinal);

create index if not exists study_plan_items_user_pending_idx
  on public.study_plan_items(user_id, plan_date)
  where completed_at is null;

-- RLS
alter table public.study_plans      enable row level security;
alter table public.study_plan_items enable row level security;

drop policy if exists "users read own study plans"   on public.study_plans;
drop policy if exists "users insert own study plans" on public.study_plans;
drop policy if exists "users update own study plans" on public.study_plans;
drop policy if exists "users delete own study plans" on public.study_plans;

create policy "users read own study plans"   on public.study_plans for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own study plans" on public.study_plans for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own study plans" on public.study_plans for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own study plans" on public.study_plans for delete
  to authenticated using (auth.uid() = user_id);

drop policy if exists "users read own study plan items"   on public.study_plan_items;
drop policy if exists "users insert own study plan items" on public.study_plan_items;
drop policy if exists "users update own study plan items" on public.study_plan_items;
drop policy if exists "users delete own study plan items" on public.study_plan_items;

create policy "users read own study plan items"   on public.study_plan_items for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own study plan items" on public.study_plan_items for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own study plan items" on public.study_plan_items for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own study plan items" on public.study_plan_items for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists study_plans_set_updated_at on public.study_plans;
create trigger study_plans_set_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();
