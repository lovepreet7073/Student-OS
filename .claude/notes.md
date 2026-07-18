# Notes Library

The first content feature. Every note is user-owned and scoped to the
`(board, class, medium, subject)` triple from the Academic Identity System —
students only ever see their own notes, filtered to their current syllabus.

## Table

```
public.notes
├── id            uuid pk
├── user_id       uuid  → auth.users            (on delete cascade)
├── board_id      uuid  → boards                (on delete restrict)
├── class_id      uuid  → classes               (on delete restrict)
├── medium_id     uuid  → mediums               (on delete restrict)
├── subject_id    uuid  → subjects              (on delete restrict)
├── title         text  1..200
├── content       text  0..50 000
├── is_bookmarked bool  default false
├── created_at    timestamptz
└── updated_at    timestamptz  (trigger)

indexes:
  notes_user_updated_idx           (user_id, updated_at DESC)
  notes_user_subject_updated_idx   (user_id, subject_id, updated_at DESC)
  notes_user_bookmarked_idx        partial WHERE is_bookmarked = true
  notes_search_idx                 GIN to_tsvector — ready for FTS later
```

**Why `on delete restrict` for board/class/medium/subject?** — Reference rows
are catalog data. If we ever soft-retire a board or subject that has notes
attached, we want the migration to fail loudly rather than silently orphan or
delete years of user content. Retirement path: mark `is_active = false` on
the catalog row, keep FK intact.

RLS: standard `auth.uid() = user_id` on select/insert/update/delete.

## Server Actions — [features/notes/actions/](../features/notes/actions/)

| Action           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `listNotes`      | Scope-filtered list + subject filter + ILIKE search + pagination |
| `getNote`        | Single note by id, RLS-guarded                                   |
| `createNote`     | Inserts with the user's current academic scope pinned            |
| `updateNote`     | Updates title/content/subject; RLS-guarded on user_id            |
| `deleteNote`     | Hard delete; RLS-guarded; can redirect                           |
| `toggleBookmark` | Sets bookmark state to an explicit boolean (no toggle races)     |

**Every mutating action** calls `revalidatePath("/app/notes")` and any relevant
detail path. Client components can await the action and expect the RSC tree
to refresh on the next render.

## Search

MVP is server-side ILIKE on title + content. The GIN full-text index landed in
the migration so we can swap to `to_tsvector` when performance justifies it —
no schema change needed.

Escape `%` / `_` in the user's query before interpolation (already handled in
`listNotes`).

## URL-synced filters — [notes-toolbar.tsx](../features/notes/components/notes-toolbar.tsx)

Query params:
- `subject` — subject UUID
- `q` — free text

`router.replace` (not push) — every keystroke shouldn't create a history entry.
The list page reads these from `searchParams` and passes them to `listNotes`.

## Subject filter chips

Fed by `profile.subjects` (already in RSC context via `getMyProfile`) — no
extra network round-trip. The "All" chip resets the filter.

## Note card styling

Subject "tone" (colour + tint) is computed deterministically from the subject
slug via [`stableToneFor`](../features/notes/components/notes-grid.tsx) so a
given subject always renders in the same colour, regardless of order in the
grid. Matches the design's rotating palette (coral / indigo / green / amber / violet).

## Bookmark toggle

Optimistic client state via `useTransition`. On success, `revalidatePath`
refreshes the surrounding RSC tree. On failure, a toast surfaces the error and
the router refresh reconciles state on the next render.

## Delete flow

Uses shadcn `AlertDialog` — Radix under the hood, focus-trapped, esc-to-close,
mobile-friendly. On confirm the Server Action redirects to `/app/notes`.

## Adding a note (mobile-first)

- 44px inputs
- Textarea min-height 240px, monospace, `text-base` on mobile (prevents iOS zoom)
- Full-width submit on mobile, `sm:w-auto` on desktop
- Cancel button always available, `variant="outline"`
- Server Action redirect on success

## Content rendering

Detail view uses `<pre className="whitespace-pre-wrap">` — plain text with
respected newlines. **Markdown rendering is deferred** to a later polish pass;
storing raw text keeps future migration to Tiptap / MDX painless.

## What this module does NOT do (yet)

- **Attachments** — image / PDF uploads via Supabase Storage. Table has no
  attachments column yet; add via migration when needed.
- **Autosave** — the form saves on submit only. Autosave-per-keystroke needs
  a debounced Server Action + optimistic status indicator.
- **Sharing** — no share links / permissions. All notes are private.
- **Version history** — no `notes_versions` table. Overwrites destroy prior
  content.
- **Full-text search UI** — ILIKE is fine for now. Wire `websearch_to_tsquery`
  once the catalog grows.

## Dashboard integration (planned, not in this module)

Once the notes table has real content, the dashboard's subject cards will
show `count(notes) per subject`. Continue hero will point at
`ORDER BY updated_at DESC LIMIT 1`. Both wire up in a small Module 3
follow-up, not Module 4.
