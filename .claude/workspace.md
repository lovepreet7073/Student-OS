# My Workspace (Module 15)

The primary destination in `/app/*`. Every existing content type — notes,
files, tasks, quizzes, bookmarks, study plan, test evaluations, community
shares — is surfaced through one filterable hub at `/app/workspace`.

Module 15 doesn't build new content features. It **unifies** what's already
there and adds activity tracking so the workspace has a "Recently opened" +
"Recently uploaded" feel from day one.

## Data

`activity_events` — one row per meaningful interaction.

| Column | Purpose |
| --- | --- |
| `entity_type` | `note` / `file` / `task` / `quiz` / `study_plan` / `test_evaluation` / `community_note` |
| `entity_id` | UUID of the source row |
| `action` | `opened` / `uploaded` / `created` |
| `title` | **Denormalised** snapshot of the entity title so the feed renders without joins and survives deletions |

**Dedupe** — a unique index on `(user_id, entity_type, entity_id, (created_at::date))` where
`action = 'opened'` means re-opening the same note twelve times in one day only
inserts once. `logActivity` catches the 23505 conflict and moves on.

RLS: read / write / delete own rows only.

## Actions

- `logActivity({ entityType, entityId, action, title })` — fire-and-forget.
  Never throws. Callers append it after a successful read / create / upload.
- `listRecentActivity({ action?, limit? })` — newest-first feed, optionally
  filtered by action.
- `getWorkspaceOverview()` — counts per category via `head: true` +
  `count: "exact"` (no rows returned). Runs 9 counts in parallel; one failed
  counter shows 0 rather than tanking the page.

## UI (`app/app/workspace/page.tsx`)

Four sections stack vertically:

1. **Sticky header** — greeting + workspace title.
2. **Quick actions** — 4-up grid: New note · Upload file · New quiz · Grade a test. Links to existing new-form routes.
3. **Categories** — 8-tile grid. Each tile shows count + click-through to the feature. Study plan and tasks show a badge (`Active` / `N today`) when appropriate.
4. **Recently opened** and **Recently uploaded** — activity feeds. Each row links to the source entity via `ENTITY_META.hrefBuilder`.

Every section is server-rendered — no client JavaScript on the hub itself. The
only client code that fires is the `<ThemeToggle/>` in the nav.

## Nav swap

`Home` (which pointed to `/app/dashboard`) is replaced with `Workspace` in
`components/layout/nav-config.ts`. `/app/dashboard` still exists as a route —
it now redirects to `/app/workspace` so no auth flow, external link, or
in-code redirect breaks.

The desktop sidebar logo also points to `/app/workspace`.

## Where activity gets logged (so far)

- `features/notes/actions/create-note.ts` — logs `note.created` after successful insert.
- `features/notes/actions/get-note.ts` — logs `note.opened` on every note detail render (deduped by day).

The pattern is: append `await logActivity({...})` right after the successful
DB write / read, before revalidating paths. It swallows failures — the primary
flow must never fail because the audit trail did.

## What still needs logging (deferred to Module 15.1)

- File open + upload — instrument `features/study-space/actions/get-file.ts` and `complete-upload.ts`.
- Task creation and completion.
- Quiz generation completion.
- Study plan generation.
- Test evaluation creation.

None of these are blocking — the workspace hub renders correctly with zero
events (empty state UI is designed for it). Add them as each feature's next
touch happens.

## Extension points

- **Chapter-level auto-organization (Module 22)** will add a `chapter_id`
  column to `notes` and `study_files`; the workspace can then group by
  chapter under each category tile.
- **Study streak / weekly progress (Module 23)** can derive from
  `activity_events` alone — days with ≥ 1 event = a streak day.

## Module 16 — Share via link (SHIPPED)

Notes gained `visibility text` (`private | link`) and `share_token text unique`
via migration 12. Postgres `new_share_token()` mints URL-safe base64 tokens.
RLS gains an anonymous-select policy where `visibility = 'link' AND share_token
IS NOT NULL`. `setNoteVisibility({ noteId, visibility })` flips the state; the
token is preserved on toggle-off so re-enabling reuses the same URL.

Public read: `getPublicNote(token)` and `/s/n/[token]` render read-only. The
route sets `robots: { index: false }` so Google doesn't crawl shared notes.

Trigger surface: `<ShareNoteDialog/>` on the note detail. See ADR-0020.

## Module 17 — Global search (SHIPPED)

`/app/search` — four parallel ILIKE queries across notes, files, tasks,
community_notes. Personal content scoped by `user_id`; community hits scoped by
(board × class × medium). Grouped results, 8 hits per group.

- `features/search/actions/search.ts` — parallel query.
- `features/search/components/search-input.tsx` — client debounced `?q=` input.
- `features/search/components/search-results.tsx` — grouped SSR results with
  snippet extraction (±40 chars around match, capped at 160).

Entry point: search icon in the workspace sticky header. FTS upgrade path in
ADR-0021.

## Design contract

- Server-rendered. No client hooks anywhere on the hub.
- Mobile-first: 2-col category grid at 375px, expands to 3 (sm) and 4 (lg).
- Every tile is a `<Link>` — no JS-driven navigation, back button works.
- Colors via semantic tokens only. Dark mode is a token flip.
