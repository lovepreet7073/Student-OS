-- AI Flashcards + Spaced Repetition (Module 28)
--
-- Two tables:
--   flashcard_decks  — one Gemini generation OR a manual create = one deck
--   flashcards       — the cards inside, each carrying its own SM-2 state
--
-- Denormalized `user_id` on `flashcards` for trivial RLS (auth.uid() = user_id).
--
-- SM-2 fields on each card:
--   ease_factor      real, default 2.5 (min clamped to 1.3 in code)
--   interval_days    integer, default 0 (next interval in days)
--   repetition       integer, default 0 (consecutive correct reviews)
--   due_at           timestamptz, default now() (next time this card is due)
--   last_reviewed_at nullable
--   lapses           integer, default 0 (times the student failed)
--   total_reviews    integer, default 0
--
-- A card with `due_at <= now()` is "due for review". A brand-new card starts
-- with `due_at = now()` so the first study session picks it up immediately.

create table if not exists public.flashcard_decks (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  board_id              uuid not null references public.boards(id)   on delete restrict,
  class_id              uuid not null references public.classes(id)  on delete restrict,
  medium_id             uuid not null references public.mediums(id)  on delete restrict,
  subject_id            uuid not null references public.subjects(id) on delete restrict,
  title                 text not null,
  description           text not null default '',
  source                text not null default 'ai_topic'
                          check (source in ('ai_topic', 'ai_note', 'manual')),
  source_note_id        uuid references public.notes(id) on delete set null,
  raw_gemini_response   jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint flashcard_decks_title_check
    check (char_length(trim(title)) between 1 and 200)
);

create index if not exists flashcard_decks_user_created_idx
  on public.flashcard_decks(user_id, created_at desc);

create index if not exists flashcard_decks_user_subject_idx
  on public.flashcard_decks(user_id, subject_id, created_at desc);

create table if not exists public.flashcards (
  id                    uuid primary key default gen_random_uuid(),
  deck_id               uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id               uuid not null,
  ordinal               integer not null,
  front                 text not null,
  back                  text not null,
  hint                  text,

  -- SM-2 state
  ease_factor           real not null default 2.5,
  interval_days         integer not null default 0,
  repetition            integer not null default 0,
  due_at                timestamptz not null default now(),
  last_reviewed_at      timestamptz,
  lapses                integer not null default 0,
  total_reviews         integer not null default 0,

  created_at            timestamptz not null default now(),

  constraint flashcards_ordinal_unique unique (deck_id, ordinal),
  constraint flashcards_front_check    check (char_length(trim(front)) between 1 and 500),
  constraint flashcards_back_check     check (char_length(trim(back))  between 1 and 2000),
  constraint flashcards_ease_check     check (ease_factor between 1.3 and 4.0),
  constraint flashcards_interval_check check (interval_days between 0 and 3650)
);

create index if not exists flashcards_deck_ordinal_idx
  on public.flashcards(deck_id, ordinal);

-- The core "what should I review now?" query — user_id + due_at.
create index if not exists flashcards_user_due_idx
  on public.flashcards(user_id, due_at);

-- RLS
alter table public.flashcard_decks enable row level security;
alter table public.flashcards      enable row level security;

drop policy if exists "users read own flashcard_decks"   on public.flashcard_decks;
drop policy if exists "users insert own flashcard_decks" on public.flashcard_decks;
drop policy if exists "users update own flashcard_decks" on public.flashcard_decks;
drop policy if exists "users delete own flashcard_decks" on public.flashcard_decks;

create policy "users read own flashcard_decks"   on public.flashcard_decks for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own flashcard_decks" on public.flashcard_decks for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own flashcard_decks" on public.flashcard_decks for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own flashcard_decks" on public.flashcard_decks for delete
  to authenticated using (auth.uid() = user_id);

drop policy if exists "users read own flashcards"   on public.flashcards;
drop policy if exists "users insert own flashcards" on public.flashcards;
drop policy if exists "users update own flashcards" on public.flashcards;
drop policy if exists "users delete own flashcards" on public.flashcards;

create policy "users read own flashcards"   on public.flashcards for select
  to authenticated using (auth.uid() = user_id);
create policy "users insert own flashcards" on public.flashcards for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users update own flashcards" on public.flashcards for update
  to authenticated using (auth.uid() = user_id);
create policy "users delete own flashcards" on public.flashcards for delete
  to authenticated using (auth.uid() = user_id);

drop trigger if exists flashcard_decks_set_updated_at on public.flashcard_decks;
create trigger flashcard_decks_set_updated_at
  before update on public.flashcard_decks
  for each row execute function public.set_updated_at();

-- Extend the activity_events entity_type CHECK so flashcard opens can be
-- logged through the shared `logActivity` helper. Rebuilding the constraint
-- avoids touching the surrounding schema.
alter table public.activity_events
  drop constraint if exists activity_events_entity_type_check;

alter table public.activity_events
  add constraint activity_events_entity_type_check
  check (entity_type in (
    'note', 'file', 'task', 'quiz', 'study_plan',
    'test_evaluation', 'community_note', 'flashcard_deck'
  ));
