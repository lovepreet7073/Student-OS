-- Chat image attachments (Module 41)
--
-- Extends the Module 37 chat surface with Gemini Vision. Students can
-- attach one image per message; the API route reads it from Storage as
-- base64 and passes it to `getGeminiChatModel()` as an inline part
-- (same pattern the test-evaluations module uses).
--
-- We add an `attachments` jsonb column to `chat_messages` — an array of
-- `{ path, mime_type, width?, height? }` records — and a dedicated
-- `chat-attachments` Storage bucket so lifecycle policies stay
-- independent from `study-files` and `test-answers`.

alter table public.chat_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.chat_messages.attachments is
  'Array of { path, mime_type, width?, height? } — objects live in the chat-attachments bucket under {user_id}/{message_id}.{ext}';

-- ---------------------------------------------------------------------------
-- Storage bucket + RLS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,               -- 10 MB per image
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public             = excluded.public;

drop policy if exists "users read own chat-attachments"   on storage.objects;
drop policy if exists "users insert own chat-attachments" on storage.objects;
drop policy if exists "users update own chat-attachments" on storage.objects;
drop policy if exists "users delete own chat-attachments" on storage.objects;

create policy "users read own chat-attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users insert own chat-attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own chat-attachments"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own chat-attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
