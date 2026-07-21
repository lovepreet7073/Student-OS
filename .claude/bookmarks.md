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
- **Bookmark counts per source in the workspace tile** — the tile shows only
  the notes bookmark count (`overview.bookmarkedNotes`) to avoid changing the
  overview contract. A follow-up can extend it to a sum.
- **Persistent tab selection** — the last tab isn't remembered across visits.
  Trivial to add via localStorage if the UX warrants it.

## Enhancement ideas

1. **Aggregate count in Workspace tile** — sum notes + files + community
   bookmarked into one number and drop the standalone community stat.
2. **Search inside bookmarks** — reuse the `/app/search` ILIKE pattern scoped
   to bookmarked rows.
3. **Bulk unbookmark** — checkbox mode for clearing stale saves.
4. **Sort options** — currently newest first; add "By title / By subject".
