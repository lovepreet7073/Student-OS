# Community Notes (Module 11)

The first social surface in StudyOS. Students share their private notes; a
teacher moderates; approved notes surface on a feed scoped to peers with the
same board × class × medium.

## Data model

| Table | Purpose |
| --- | --- |
| `community_notes` | Snapshot of a shared note. Denormalized scope + `author_display_name`. Status lifecycle `pending → approved | rejected`. Counters (`likes_count`, `bookmarks_count`) maintained by triggers. |
| `community_likes` | `(community_note_id, user_id)` composite PK. Trigger `tick_community_likes` keeps `community_notes.likes_count` in sync. |
| `community_bookmarks` | Same shape as likes. Personal — RLS restricts SELECT to `user_id = auth.uid()`. |
| `community_reports` | User-flagged concerns for the moderation queue. Unique on `(community_note_id, user_id)` so a user can only report a note once. |

**Helper function** — `public.is_teacher(uid uuid)` returns bool by looking up
`user_preferences.user_role`. Marked `security definer` so RLS policies can
call it without recursion into the `user_preferences` policy.

## RLS summary

- `community_notes`
  - SELECT: `status = 'approved' OR author OR is_teacher()` — pending notes stay private to author + moderators.
  - INSERT: only the author, only as `pending`.
  - UPDATE: only teachers (used for moderation).
  - DELETE: only the author.
- `community_likes`: read all; write/delete own only.
- `community_bookmarks`: fully personal — read/write/delete own only.
- `community_reports`: reporters see their own; teachers see all.

## Server Actions (`features/community/actions/`)

| Action | Access | Purpose |
| --- | --- | --- |
| `shareNote({ noteId })` | Note owner | Snapshots a private note into `community_notes` as pending. |
| `listCommunityNotes({ subjectId? })` | Anyone | Approved feed filtered by caller's academic scope. |
| `getCommunityNote(id)` | Anyone (RLS gates visibility) | Full detail + hasLiked/hasBookmarked/isOwn flags. |
| `listPendingModeration()` | Teacher only | Pending queue scoped to teacher's board × class × medium. |
| `moderateNote({ id, action, reason? })` | Teacher only | Approves or rejects with a reason. Reason ≥ 3 chars required for reject (superRefine). |
| `toggleLike(id)` | Signed-in user | Flips like state; count kept in sync by trigger. |
| `toggleCommunityBookmark(id)` | Signed-in user | Flips personal bookmark. |
| `reportCommunityNote({ id, reason })` | Signed-in user | Flags note for teacher review. |

## Author name — why we snapshot it on the row

`auth.users` isn't queryable via the anon key. Rather than adding a service-role
view or a JOIN on `user_preferences.display_name` (which doesn't exist), the
share action writes `author_display_name` at share-time as a snapshot. This
matches the community note's "frozen copy" model: even if the author renames
themselves later, the shared copy shows the name they had when they shared.

## Feed scope

Users only see notes matching their **own** `(board_id, class_id, medium_id)`.
Subject filter is optional — omit and we cast the net to all of the user's
active subjects. Peers on other boards never see each other's community feed.

## Nav swap

`Progress` was a stub. Module 11 swaps it for `Community` in
[`components/layout/nav-config.ts`](../components/layout/nav-config.ts). The
`/app/progress` route file is left in place (returns a "coming soon" empty
state) so any deep link doesn't 404.

## Teacher-only surfaces

- Header CTA on `/app/community` — visible only when `profile.role === 'teacher'`.
- `/app/community/moderation` — server-side redirect to `/app/community` if the
  role is student. RLS also refuses updates from non-teachers as a second wall.

## Client polling

Moderation actions call `router.refresh()` after mutation instead of using
optimistic updates. The queue is teacher-facing (low traffic) and a full RSC
refresh gives them the freshest state. Same pattern as Module 9 test evaluations.

## Community v2 (Module 12) — what shipped

- **Report triage** — teachers get a `?tab=reported` view on `/app/community/moderation`
  that aggregates open reports per note (`listReportedNotes`). Actions:
  - `dismissReports(communityNoteId)` — flips `dismissed_at` / `dismissed_by` on every
    open row. Reports stay in the DB for audit; the queue just filters them out.
  - `unpublishNote({ id, action: 'reject', reason })` — flips an approved note back
    to `rejected`, auto-dismisses every open report on the note in the same server
    action so the queue reflects the resolution.
- **Contributor profile** — `/app/community/authors/[id]` (`getContributor`). Shows
  the author's display name + share/like/save totals, plus every approved share
  they've made that matches the *viewer's* academic scope (so users on other
  boards can't fingerprint a contributor across the app). Author name in cards +
  detail view links here.
- **My shares** on `/app/profile` — `listMyShares` returns every community note
  the caller has ever shared, bucketed by status (`pending / approved / rejected`).
  Each row has an "Unshare" action (`deleteMyShare`) that removes only the
  community copy; the private note in the Notes library is untouched.

## Community v3 — deferred

- Downloads (export community notes as PDF/markdown).
- Comments / thread replies.
- Per-report actions (currently reports are aggregated per-note; a teacher can't yet
  dismiss one report while keeping others open).
- Automatic "trending" or "recently active" sort in the feed.
