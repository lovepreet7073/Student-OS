# Teacher Analytics

Module 30. A read-only dashboard for teacher accounts (`profile.role === 'teacher'`)
that surfaces what they've moderated and who in their scope is contributing.

## Scope

Every metric is scoped to the teacher's own `(board × class × medium)` — the
same scope that already governs which pending notes they can moderate.
Analytics is a mirror of the community they own, not the whole platform.

## Data source

No new tables. Everything reads from existing columns:

- `community_notes.moderated_by` — set by `moderateNote` when a teacher
  approves/rejects. This is the primary attribution key for teacher activity.
- `community_notes.moderated_at` — powers the week/month filters.
- `community_notes.status` — used to split approve vs reject totals.
- `community_notes.author_id` + `author_display_name` — powers the top
  contributors leaderboard.
- `community_reports.dismissed_at is null` — open reports counter.

## Server action — [features/teacher-analytics/actions/get-teacher-overview.ts](../features/teacher-analytics/actions/get-teacher-overview.ts)

Fires 8 queries in parallel:

1. Total approved by this teacher
2. Total rejected by this teacher
3. Approved this week
4. Rejected this week
5. Pending queue depth in the teacher's scope
6. Open reports (undismissed)
7. Recent moderation activity (last 20 actions by this teacher, with joins)
8. Contributors in scope (raw rows for the leaderboard — grouped in JS)

Failure on any single count returns zero for that slot (analytics is
diagnostic — a broken counter is a UI degradation, not a crash).

The contributor leaderboard groups the raw author rows in JavaScript because
Supabase JS doesn't expose GROUP BY without an RPC. At current scale (a few
thousand approved notes per scope max) it's a rounding error; if the query
grows we'll switch to a `contributors_by_scope` DB view.

## Route

- `/app/teacher` — gated by `profile.role === 'teacher'`. Non-teachers redirect
  to `/app/workspace`.

Access is via a small icon button next to "Moderate" on `/app/community`
for teacher accounts.

## What this module does NOT do

- **Cross-scope analytics** — no view of "all boards, all classes". By design.
- **Individual student drill-down** — clicking a contributor navigates to
  their public author page (Module 12), not a private analytics view.
- **Time-series charts** — the KPI cards show current + this-week counts.
  Sparklines / trend lines are on the enhancement list.
- **Export / CSV download** — not shipped. Add when the first teacher asks.
- **Nav item** — the 5-item mobile nav is locked. Discoverable through community.

## 30-day activity chart (Module 35)

`getTeacherDailyActivity(days = 30)` returns a dense array of 30 buckets
(one per day, empty buckets included) with `{ day, approved, rejected }`.
`<ActivityChart>` renders a stacked SVG bar chart — no library, no client
JS. Green segment (approved) stacks on red (rejected). Empty-state
renders when no bucket has activity so the chart never shows as a bare
grid.

Grouping runs in JS at the action layer because Supabase JS doesn't
expose GROUP BY without an RPC. At 30 days × ≤ 100 actions/day this is a
rounding error; if it grows we swap in a `teacher_daily_activity` view.

## Time-range toggle (Module 50)

The daily-activity chart section gained a **30 days / 90 days / 1 year**
segmented control. Options are plain `<Link>`s to
`/app/teacher?range=<X>`; the server component reads `searchParams.range`,
passes it to `getTeacherDailyActivity(range)`, and re-renders. No client
fetch. `"all"` caps at 365 days for chart legibility — weekly bucketing
is a follow-up if we ever ship yearly cohorts.

## Enhancement ideas

1. **Median time-to-moderation** — surface how fast a teacher clears the queue.
2. **Report-source breakdown** — which authors get reported most, and for what.
3. **Cohort comparison** — show this teacher's approval rate vs the average
   for the same board × class × medium.
4. **Weekly digest email** — same data set, delivered Sundays via a cron job.
5. **Weekly bucketing** — swap the 1-year daily grid for 52 weekly bars
   when the range grows enough that daily is unreadable.
