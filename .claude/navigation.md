# Navigation IA

Module 56. How students find their way around StudyOS.

## Three tiers of navigation

1. **Primary destinations** — 5 items, locked by mobile-first
   constitution (see `mobile-first.md`). Rendered as both the desktop
   sidebar's top block and the mobile bottom nav. Order matters: it's
   the tab order.

   | Slot | Route             | Rationale                                          |
   |------|-------------------|----------------------------------------------------|
   | 1    | `/app/dashboard`  | The "today" view — streak, progress, focus.        |
   | 2    | `/app/workspace`  | The hub for every content type + recent activity.  |
   | 3    | `/app/notes`      | The most-used content type gets its own slot.      |
   | 4    | `/app/community`  | Social; the peer share + moderation surface.       |
   | 5    | `/app/profile`    | Self; identity, subjects, settings.                |

2. **Desktop sidebar Shortcuts** (ADR-0029) — a second nav block below
   the primary 5, rendered only on `lg+`. Surfaces every remaining
   content type (Files, Tasks, Quizzes, Flashcards, Chat, Planner,
   Tests, Syllabus, Calendar, Focus, Achievements, Helper) as a flat
   labeled list. Mobile intentionally hides this — the 5-item bottom
   nav is the constitutional limit; on small screens, Workspace is one
   tap away.

3. **Workspace intent groups** (Module 56) — the primary discovery
   surface. `/app/workspace` bins every feature into four intent
   sections:

   | Section          | Tiles                                                                 |
   |------------------|-----------------------------------------------------------------------|
   | Study material   | Notes · My Study Space · Syllabus · Bookmarks                         |
   | Practice         | Flashcards · Quizzes · Test Evaluations · AI Study Chat               |
   | Plan             | Tasks · AI Study Planner · Calendar                                   |
   | Progress         | Community · Achievements · Helper                                     |

   Each tile carries the feature name, a live count/badge, AND a
   one-line description — so a student who's never opened the feature
   before can guess what it does before clicking in.

## Guiding principles

- **The 5-nav is sacred.** Every ambition to "just add one more" gets
  routed to Workspace or Shortcuts. See `mobile-first.md` and ADR-0006.
- **Group by intent, not by feature type.** Alphabetized grids force
  students to already know feature names. Intent groups let them find
  by goal.
- **Every tile earns its description.** No naked icons; every entry has
  a name + a one-line description + (where useful) a live counter.
- **Helper is one tap away from confusion.** The Workspace copy
  explicitly links to `/app/help` for students who can't find something.

## What we did NOT do

- **Rename Workspace to "My Study" or similar.** The name is fine once
  the tiles are grouped — the confusion was the flat grid, not the label.
- **Move Chat/Flashcards into the primary 5-nav.** Both are
  discoverable via Workspace tiles + desktop Shortcuts. Adding either
  would push us to 6 primary items and break the bottom nav.
- **Mobile secondary nav (a "More" drawer).** The Workspace tile IS the
  "More" drawer on mobile; two indirections would confuse students.

## Enhancement ideas

1. **Mobile Workspace-tile deep links from Dashboard** — surface the top
   3 tiles ("continue what you were doing") on the mobile dashboard.
2. **Sticky "Continue" bar** — the last opened content type as a small
   sticky above the Workspace grid.
3. **Sidebar collapse** — for teachers who spend all day on moderation,
   let them collapse the Shortcuts section.
