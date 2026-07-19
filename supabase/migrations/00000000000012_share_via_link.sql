-- Share via link (Module 16)
--
-- Adds a three-state visibility to notes plus a random unguessable token so
-- an author can hand a note URL to a friend without needing a StudyOS
-- account. The token doubles as the routing key on `/s/n/[token]`.
--
-- We only touch `notes` here — study_files gets the same treatment when
-- Storage-object sharing is designed (needs signed URLs, deferred to Module
-- 20 or later).

alter table public.notes
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'link')),
  add column if not exists share_token text unique;

-- Token generation helper: 22-char URL-safe base64 (~130 bits of entropy).
-- Using gen_random_bytes so callers don't have to think about randomness.
create or replace function public.new_share_token()
returns text
language sql
volatile
as $$
  select translate(encode(gen_random_bytes(16), 'base64'), '+/=', '-_') ;
$$;

grant execute on function public.new_share_token() to authenticated;

-- Fast lookup on the public route.
create unique index if not exists notes_share_token_idx
  on public.notes(share_token)
  where share_token is not null;

-- Anyone (anon or authed) may read a note published via link. RLS on the
-- private-mode rows still blocks by requiring the visibility check.
drop policy if exists "notes public read via token" on public.notes;
create policy "notes public read via token"
  on public.notes for select
  to anon, authenticated
  using (visibility = 'link' and share_token is not null);
