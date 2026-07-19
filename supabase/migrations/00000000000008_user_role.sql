-- User role — extends academic identity with student vs teacher.
--
-- Why: Auth v2 introduces an audience picker on signup ("I'm a student" /
-- "I'm a teacher"). The role changes copy across landing/auth/onboarding but
-- keeps the same academic scope (board/class/medium/subjects). Community
-- features (Module 11+) will use the role for moderation and vetting.
--
-- Migration is idempotent: safe to re-run.

alter table public.user_preferences
  add column if not exists user_role text not null default 'student'
    check (user_role in ('student', 'teacher'));

create index if not exists user_preferences_role_idx
  on public.user_preferences(user_role)
  where user_role = 'teacher';
