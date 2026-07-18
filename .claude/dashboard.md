# Dashboard & App Shell

The chrome every `/app/*` route lives inside, plus the home screen.

## Nav destinations

Locked at 5 (mobile-friendly limit). Order matters — it's the tab order in the
bottom nav and the vertical order in the desktop sidebar.

| Key      | Route           | Icon        | Notes                                   |
| -------- | --------------- | ----------- | --------------------------------------- |
| home     | /app/dashboard  | Home        | Greeting, hero, tasks, subjects, stats  |
| notes    | /app/notes      | BookText    | Subject-aware notes (Module 4)          |
| study    | /app/study      | Layers      | Flashcards, spaced repetition (Module 6+)|
| progress | /app/progress   | BarChart3   | Streaks, mastery, achievements          |
| profile  | /app/profile    | UserCircle2 | Settings, sign out                      |

Edit the list in [components/layout/nav-config.ts](../components/layout/nav-config.ts).
Adding a 6th item is possible but push hard on necessity — mobile bottom nav
starts to feel cramped past 5.

## Shell layout

**Mobile / tablet (`< lg`):**
- Full-width content
- Fixed bottom nav (66px tall + `pb-safe`)
- Content gets `padding-bottom: calc(66px + env(safe-area-inset-bottom))` so
  nothing hides behind the nav.
- FAB (56px, primary tint) floats above the bottom nav on relevant screens.

**Desktop (`lg+`):**
- 250px sticky left sidebar with logo + nav + primary CTA ("New note") + user
  card + theme toggle
- Content takes the rest, standard scroll on the body
- No bottom nav, no FAB (sidebar CTA replaces it)

Files:
- [components/layout/app-shell.tsx](../components/layout/app-shell.tsx) — composer
- [components/layout/desktop-sidebar.tsx](../components/layout/desktop-sidebar.tsx) — desktop
- [components/layout/mobile-bottom-nav.tsx](../components/layout/mobile-bottom-nav.tsx) — mobile

## Home screen composition

Every widget is a **feature-owned** RSC. The dashboard page just composes them.

| Widget          | Data source                          | Status      |
| --------------- | ------------------------------------ | ----------- |
| GreetingHeader  | `profile.displayName` (real)         | ✅          |
| StreakBadge     | `study_sessions` streak counter      | placeholder |
| ContinueHero    | Last-opened note / session           | placeholder |
| TodaysPlan      | `tasks` table (Module 5)             | placeholder |
| SubjectsGrid    | `profile.subjects` (real)            | ✅          |
| WeekStats       | Analytics module                     | placeholder |
| Fab             | Always points at `/app/notes`        | ✅          |

Placeholder widgets show honest zero states ("0 notes · 0%", "0m study time")
until their backing feature ships. Never fabricate data.

**Adding a new dashboard widget:**
1. Create `features/dashboard/components/{name}.tsx`
2. Import + compose in `app/app/dashboard/page.tsx`
3. Pull real data via a Server Action that consumes `getAcademicScope()` for
   subject/board/class filtering
4. Only render the widget when there's non-empty data OR show an EmptyState

## Profile screen

Real content:
- Avatar (deterministic 2-letter, deterministic tone from name hash)
- Display name + email + academic identity summary
- "Edit" link to `/onboarding` (which shows the wizard again with existing selections)

Settings rows: Account, Notifications, Offline downloads, Appearance, Help, Sign out.
All except Sign out link to `#` — they'll ship as sub-routes in later modules
(likely `/app/settings/{key}`).

Sign out uses the Server Action from Module 1's `features/auth/actions/sign-out.ts`.

## Design tokens used

Everything comes from `app/globals.css`. No hardcoded colors in shell code.
The one exception: the FIVE subject tones in [subjects-grid.tsx](../features/dashboard/components/subjects-grid.tsx)
use inline hex because they're a rotating palette, not semantic tokens. When
adding more, extend `TONE_STYLES` in that file.

## Accessibility notes

- Every nav item has `aria-current="page"` when active
- Icon-only mobile nav items also have text labels (11px) — no icon-only tab bars
- User avatar buttons have `aria-label` (avatar itself is `aria-hidden`)
- Touch targets ≥ 44px on every interactive element
- Streak badge exposes `aria-label` with day count for screen readers
- FAB has explicit `aria-label` since it's icon-only
