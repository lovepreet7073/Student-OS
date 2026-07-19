-- Custom subjects (fix)
--
-- Some students study a subject that isn't in the seed list (Vocational tracks,
-- optional electives, tuition-only prep). Let them add their own without
-- polluting the shared table for everyone.
--
-- New column `created_by` tracks the author:
--   NULL          → seed / system subject, visible to everyone.
--   <uuid>        → user-created, visible ONLY to that user.
--
-- Extends the existing SELECT policy so users see system rows PLUS their own.

alter table public.subjects
  add column if not exists created_by uuid references auth.users(id) on delete cascade;

create index if not exists subjects_created_by_idx
  on public.subjects(created_by) where created_by is not null;

drop policy if exists "authenticated read active subjects" on public.subjects;
create policy "authenticated read active subjects"
  on public.subjects for select
  to authenticated
  using (
    is_active = true
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "users insert own custom subjects" on public.subjects;
create policy "users insert own custom subjects"
  on public.subjects for insert
  to authenticated
  with check (auth.uid() = created_by and is_active = true);

drop policy if exists "users delete own custom subjects" on public.subjects;
create policy "users delete own custom subjects"
  on public.subjects for delete
  to authenticated
  using (auth.uid() = created_by);
