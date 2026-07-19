# Auth v2 — Marketing landing, teacher role, split-screen auth

Module 10 delivered per the `StudyOS_Auth_v2_Deck.pptx` design deck in repo root.

## What Auth v2 introduces

1. **Teacher role** — `user_preferences.user_role text not null default 'student' check (in ('student','teacher'))`, partial index for teacher lookups. Type: `UserRole = 'student' | 'teacher'`. Carried on `AcademicProfile.role`.
2. **Landing rebuild** — `app/page.tsx` → `features/marketing/components/LandingExperience`. Audience toggle changes copy, not layout.
3. **Auth v2 shell** — `AuthShell` accepts a `marketingPanel: ReactNode` slot. Brand panel on LEFT, form on RIGHT (`lg:grid-cols-[0.9fr_1fr]`).
4. **Signup audience picker** — `AudiencePicker` two-tile radio. Value flows: `?as=student|teacher` URL param → form default → `signUp` action → `auth.user_metadata.role` → `save-my-profile` upsert → `user_preferences.user_role`.
5. **Role indicator on profile** — small chip in the account card so users always know what they're marked as.

## Component map

| Layer | File |
| --- | --- |
| Landing composition | `features/marketing/components/landing-experience.tsx` |
| Audience toggle (landing) | `features/marketing/components/audience-toggle.tsx` |
| Product preview card | `features/marketing/components/landing-preview.tsx` |
| Feature grid (6-up) | `features/marketing/components/landing-feature-grid.tsx` |
| Social proof strip | `features/marketing/components/landing-social-proof.tsx` |
| Auth shell (v2) | `features/auth/components/auth-shell.tsx` |
| Login marketing panel | `features/auth/components/marketing/login-panel.tsx` |
| Signup marketing panel | `features/auth/components/marketing/signup-panel.tsx` |
| Audience picker (signup) | `features/auth/components/audience-picker.tsx` |

## Copy source of truth

All hero/eyebrow/CTA/testimonial copy comes directly from the deck. If the deck
updates, update these files first:

- Landing hero + feature grid → `landing-experience.tsx`, `landing-feature-grid.tsx`.
- Login marketing → `marketing/login-panel.tsx` (headline + 3 trust lines + Aisha testimonial).
- Signup marketing → `marketing/signup-panel.tsx` (headline + 3 benefit lines + stats strip).

## Role flow (end-to-end)

1. Landing page audience toggle sets `?as=student` or `?as=teacher` on the "Get started" CTA.
2. `/signup` page reads `?as=` and passes as `initialRole` to `SignUpForm`.
3. `SignUpForm` shows `AudiencePicker` at the top (user can still swap). Role is a hidden `input` in the form; RHF validates via `roleSchema`.
4. `signUp` action calls `supabase.auth.signUp({ options: { data: { role } } })` → role lives in `auth.users.user_metadata.role` until onboarding.
5. `saveMyProfile` (onboarding submit) reads `user_metadata.role` as fallback and writes to `user_preferences.user_role`.
6. `getMyProfile` returns it as `profile.role` for every downstream feature.

## Why role is on `user_preferences` and not a separate table

- Every content query already joins `user_preferences` via `getAcademicScope()`.
  Making role a peer column keeps queries flat — no extra join.
- Role is 1:1 with the user forever. A separate `user_roles` table only
  makes sense if we later add multiple roles (admin, moderator) — Module 11+
  will introduce that as `user_roles` for admin, keeping `user_role` on
  preferences for the primary audience type.

## What still routes to `student` by default

- Google OAuth users skip the picker; DB default = `student`. They can flip
  in Profile → Edit later (deferred to a future edit UI).
