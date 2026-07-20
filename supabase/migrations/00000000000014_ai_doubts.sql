-- AI Doubt Solver (Module 18)
--
-- Student asks a question, Gemini answers with step-by-step explanation.
-- Each question is a standalone row — no multi-turn chat threading yet
-- (that's a v2 concern with a separate `messages` table).
--
-- Status lifecycle:  processing  →  answered | failed
-- The client polls `/app/doubt/[id]` via router.refresh() until status flips.

create table if not exists public.ai_doubts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  subject_id    uuid references public.subjects(id) on delete set null,
  question      text not null,
  answer        text not null default '',
  status        text not null default 'processing'
                check (status in ('processing', 'answered', 'failed')),
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint ai_doubts_question_len check (char_length(trim(question)) between 3 and 4000),
  constraint ai_doubts_answer_len   check (char_length(answer) <= 20000)
);

create index if not exists ai_doubts_user_created_idx
  on public.ai_doubts(user_id, created_at desc);

alter table public.ai_doubts enable row level security;

drop policy if exists "ai_doubts select" on public.ai_doubts;
drop policy if exists "ai_doubts insert" on public.ai_doubts;
drop policy if exists "ai_doubts update" on public.ai_doubts;
drop policy if exists "ai_doubts delete" on public.ai_doubts;

create policy "ai_doubts select"
  on public.ai_doubts for select
  to authenticated using (auth.uid() = user_id);

create policy "ai_doubts insert"
  on public.ai_doubts for insert
  to authenticated with check (auth.uid() = user_id);

create policy "ai_doubts update"
  on public.ai_doubts for update
  to authenticated using (auth.uid() = user_id);

create policy "ai_doubts delete"
  on public.ai_doubts for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists ai_doubts_set_updated_at on public.ai_doubts;
create trigger ai_doubts_set_updated_at
  before update on public.ai_doubts
  for each row execute function public.set_updated_at();
