-- AI Study Chat (Module 37)
--
-- Multi-turn conversations with Gemini. First AI feature that isn't
-- structured-output — Gemini returns prose tokens, streamed over an
-- API route (Server Actions don't support streaming responses).
--
-- Two tables:
--   chat_conversations  — one row per conversation thread
--   chat_messages       — one row per user or assistant turn
--
-- `user_id` denormalised on `chat_messages` so RLS is `auth.uid() =
-- user_id` — trivial, no EXISTS-across-tables.
--
-- Titles are set to the first ~40 chars of the opening user message
-- on create. Users can rename later (not shipped in v1).

create table if not exists public.chat_conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  subject_id   uuid references public.subjects(id) on delete set null,
  title        text not null default 'New chat',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint chat_conversations_title_check
    check (char_length(trim(title)) between 1 and 200)
);

create index if not exists chat_conversations_user_updated_idx
  on public.chat_conversations(user_id, updated_at desc);

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id         uuid not null,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now(),

  constraint chat_messages_content_check
    check (char_length(content) between 1 and 20000)
);

-- The chat load: messages of a conversation in order.
create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages(conversation_id, created_at asc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages      enable row level security;

drop policy if exists "chat_conversations select" on public.chat_conversations;
drop policy if exists "chat_conversations insert" on public.chat_conversations;
drop policy if exists "chat_conversations update" on public.chat_conversations;
drop policy if exists "chat_conversations delete" on public.chat_conversations;

create policy "chat_conversations select"
  on public.chat_conversations for select
  to authenticated using (auth.uid() = user_id);
create policy "chat_conversations insert"
  on public.chat_conversations for insert
  to authenticated with check (auth.uid() = user_id);
create policy "chat_conversations update"
  on public.chat_conversations for update
  to authenticated using (auth.uid() = user_id);
create policy "chat_conversations delete"
  on public.chat_conversations for delete
  to authenticated using (auth.uid() = user_id);

drop policy if exists "chat_messages select" on public.chat_messages;
drop policy if exists "chat_messages insert" on public.chat_messages;
drop policy if exists "chat_messages delete" on public.chat_messages;

create policy "chat_messages select"
  on public.chat_messages for select
  to authenticated using (auth.uid() = user_id);
create policy "chat_messages insert"
  on public.chat_messages for insert
  to authenticated with check (auth.uid() = user_id);
create policy "chat_messages delete"
  on public.chat_messages for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists chat_conversations_set_updated_at on public.chat_conversations;
create trigger chat_conversations_set_updated_at
  before update on public.chat_conversations
  for each row execute function public.set_updated_at();
