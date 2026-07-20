-- Chapter organization for notes (Module 20)
--
-- The `chapters` table already exists (Module 8 Study Space) and files can
-- point at a chapter via `study_files.chapter_id`. This migration extends
-- the same pattern to notes so students can group notes by chapter and see
-- a "Syllabus" view — content organised the way their textbook is.
--
-- `chapter_id` is nullable: notes without a chapter still show under a
-- "Loose notes" bucket in the syllabus view. Reference is SET NULL on
-- chapter delete so orphaned notes don't disappear.

alter table public.notes
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

create index if not exists notes_chapter_idx
  on public.notes(chapter_id) where chapter_id is not null;

-- Composite index for the syllabus view query: notes for a user grouped by
-- (subject, chapter), ordered by newest.
create index if not exists notes_syllabus_view_idx
  on public.notes(user_id, subject_id, chapter_id, updated_at desc);
