-- Community v2 — report triage + author lookup + my-shares
--
-- Adds:
--   1. `dismissed_at` timestamp on community_reports so teachers can clear a
--      report without deleting the audit trail.
--   2. `dismissed_by` fkey so we know who cleared it.
--   3. Indexes tuned for the triage queue (undismissed reports per note) and
--      contributor-profile lookups (approved notes per author).
--
-- No schema changes to community_notes — the snapshot table stays as-is.

alter table public.community_reports
  add column if not exists dismissed_at timestamptz,
  add column if not exists dismissed_by uuid references auth.users(id) on delete set null;

-- Triage queue: undismissed reports, newest first.
create index if not exists community_reports_open_idx
  on public.community_reports(community_note_id, created_at desc)
  where dismissed_at is null;

-- Contributor profile: approved notes by author, newest first.
create index if not exists community_notes_author_approved_idx
  on public.community_notes(author_id, created_at desc)
  where status = 'approved';

-- Teachers can now update reports (to dismiss). Add the missing policy.
drop policy if exists "community_reports update" on public.community_reports;
create policy "community_reports update"
  on public.community_reports for update
  to authenticated
  using (public.is_teacher(auth.uid()));
