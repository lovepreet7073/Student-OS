-- Flashcard reviews audit (Module 34)
--
-- One row per review. Powers retention analytics — the fraction of reviews
-- graded 'good' or 'easy' (i.e. the student actually knew the answer) — and
-- opens the door to per-card difficulty tuning down the road.
--
-- We DON'T need this to run the scheduler. SM-2 state on the card row is
-- enough for that. This table is pure telemetry — an append-only log the
-- deck view queries with COUNT(*) FILTER (WHERE quality IN ('good','easy')).
--
-- `card_id` cascades on card delete so retention stats never dangle. The
-- `user_id` denormalisation matches the flashcards table's RLS pattern:
-- `auth.uid() = user_id` — trivial policy, no cross-table EXISTS.

create table if not exists public.flashcard_reviews (
  id             uuid primary key default gen_random_uuid(),
  card_id        uuid not null references public.flashcards(id) on delete cascade,
  deck_id        uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id        uuid not null,
  quality        text not null check (quality in ('again', 'hard', 'good', 'easy')),
  ease_before    real not null,
  ease_after     real not null,
  interval_after integer not null,
  reviewed_at    timestamptz not null default now()
);

-- The retention query: "for deck X, how many reviews were 'good' or 'easy'?"
create index if not exists flashcard_reviews_deck_reviewed_idx
  on public.flashcard_reviews(deck_id, reviewed_at desc);

-- Per-user chronology (for cross-deck retention when we need it).
create index if not exists flashcard_reviews_user_reviewed_idx
  on public.flashcard_reviews(user_id, reviewed_at desc);

alter table public.flashcard_reviews enable row level security;

drop policy if exists "flashcard_reviews select" on public.flashcard_reviews;
drop policy if exists "flashcard_reviews insert" on public.flashcard_reviews;

create policy "flashcard_reviews select"
  on public.flashcard_reviews for select
  to authenticated using (auth.uid() = user_id);

create policy "flashcard_reviews insert"
  on public.flashcard_reviews for insert
  to authenticated with check (auth.uid() = user_id);

-- No update / delete policies — audit rows are immutable. Cascades from
-- the parent card/deck handle cleanup.
