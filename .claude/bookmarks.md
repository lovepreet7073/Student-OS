# Bookmarks (unified view)

Module 29. A single `/app/bookmarks` destination that folds three previously
separate bookmark surfaces into one tabbed view.

## Storage — split by ownership shape, not by type

Two of the three sources use a per-row boolean because each row has one owner:

| Source          | Storage                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| notes           | `notes.is_bookmarked boolean` (Module 2)                                      |
| study_files     | `study_files.is_bookmarked boolean` (Module 8)                                |
| community_notes | `community_bookmarks(user_id, community_note_id, created_at)` — many-to-many  |

Community shares are cross-user, so a boolean on the note itself couldn't
represent "peer X saved it but peer Y didn't". The join table is minimal — the
primary key `(user_id, community_note_id)` doubles as the uniqueness guarantee.

## Server actions

- `features/notes/actions/toggle-bookmark.ts` — existing (per-note boolean)
- `features/study-space/actions/toggle-bookmark.ts` — existing (per-file boolean)
- `features/community/actions/toggle-community-bookmark.ts` — existing (already
  was implemented; this module ships the missing table via migration 18)
- `features/bookmarks/actions/list-bookmarks.ts` — new. Three parallel queries
  capped at 30 each, returns `BookmarkOverview` for the unified view.

Every toggle action revalidates `/app/bookmarks` in addition to the source
list, so the unified view stays in sync with any of the three writers.

## Route

- `/app/bookmarks` — tabbed view: `All | Notes | Files | Community`. Server-loads
  the overview; the tab switcher is a client component that filters in memory.
  Empty state suggests the bookmark icon UX.

## Nav

Not added to the 5-item nav. The Workspace tile "Bookmarks" now points at
`/app/bookmarks` instead of the old `/app/notes?bookmarked=1` deep-link.

## What this module does NOT do

- **Cross-source folders / collections** — bookmarks are a flat list per source.
- **Persistent tab selection** — the last tab isn't remembered across visits.
  Trivial to add via localStorage if the UX warrants it.

## Module 33 follow-up (aggregate count)

`WorkspaceOverview` now exposes `bookmarkedTotal` — the sum of notes +
study_files + community_bookmarks — and the Workspace bookmarks tile reads
that field. The old per-source `bookmarkedNotes` was removed since no other
surface depended on it.

## Client-side search (Module 36)

`/app/bookmarks` gained a search input. Filters the currently-loaded set
in memory (title + subtitle case-insensitive match) — no server round-trip,
no per-source pagination changes. Fine for our list cap (30 items per
source, 90 max total). Custom "no matches" empty state distinguishes an
empty search from an empty library.

## Enhancement ideas

1. **Server-side search across full bookmark set** — when a user crosses the 90-item cap.
2. **Bulk unbookmark** — checkbox mode for clearing stale saves.
3. **Sort options** — currently newest first; add "By title / By subject".
