# Daily Tasks

Small, focused module. Every student's to-do list, scoped to their academic
identity like every other content feature.

## Table

```
public.tasks
├── id           uuid pk
├── user_id      uuid  → auth.users     (cascade)
├── board_id     uuid  → boards         (restrict)
├── class_id     uuid  → classes        (restrict)
├── medium_id    uuid  → mediums        (restrict)
├── subject_id   uuid  → subjects       (set null)      ← nullable
├── title        text  1..200 (trimmed)
├── notes        text  0..5000 (nullable)
├── due_date     date  (nullable)
├── completed_at timestamptz (nullable — presence = done, timestamp = when)
├── is_pinned    bool  default false
├── created_at   timestamptz
└── updated_at   timestamptz (trigger)

indexes (partial):
  tasks_user_active_idx      WHERE completed_at IS NULL
  tasks_user_done_idx        WHERE completed_at IS NOT NULL
  tasks_user_subject_idx     WHERE completed_at IS NULL
```

Two subtle choices:

- **`subject_id` is nullable** — some tasks aren't syllabus items ("Bring lab
  coat tomorrow"). Cross-subject tasks are first-class.
- **`completed_at timestamptz` instead of a `done bool`** — presence flags
  done, AND we get free auditing ("finished at 11:47 PM"). Free future
  features: "streak of days you closed all today's tasks", per-hour completion
  charts.
- **`on delete set null` on subject_id** — retiring a subject shouldn't delete
  user work. Tasks orphan cleanly to "no subject".

## Filter semantics — [list-tasks.ts](../features/tasks/actions/list-tasks.ts)

| Filter    | Predicate                                                                 |
| --------- | ------------------------------------------------------------------------- |
| today     | `completed_at IS NULL AND (due_date = today OR due_date IS NULL)`         |
| upcoming  | `completed_at IS NULL AND due_date > today`                               |
| backlog   | `completed_at IS NULL AND due_date IS NULL`                               |
| done      | `completed_at IS NOT NULL` ordered by `completed_at DESC`                 |
| all       | no completion filter, sorts active first                                  |

`today` intentionally sweeps undated tasks in with dated-for-today ones — a
Class 10 student adding "revise chapter 3" without a date most likely means
"today". Reduces friction on quick-add.

## Server Actions — [features/tasks/actions/](../features/tasks/actions/)

Standard shape:
- `listTasks({ filter, subjectId?, limit? })`
- `createTask({ title, subjectId?, dueDate?, notes? })` — pins current scope
- `toggleTask({ id, done: bool })` — explicit boolean, no race
- `updateTask({ id, ... })`
- `deleteTask({ id })`

Every mutating action revalidates both `/app/tasks` AND `/app/dashboard` — the
dashboard widget is a first-class consumer, its cache invalidates in lockstep.

## Quick-add flow

[TaskQuickAdd](../features/tasks/components/task-quick-add.tsx) is the primary
create surface. Collapsed = single-line input. Focused = expands to reveal
subject + due date selectors. Submit collapses back with a fresh input for
another task. No modal. Optimised for "capture, don't fiddle".

Filter defaults the due date:
- On `today`/`backlog`/`all` → prefill today
- On `upcoming` → leave blank (user wants a future date)

## Dashboard integration — [features/dashboard/components/todays-plan.tsx](../features/dashboard/components/todays-plan.tsx)

The dashboard's "Today's plan" widget is now a **server component** that calls
`listTasks({ filter: 'today', limit: 5 })` directly. No prop drilling from the
page. Widget owns its data.

Rendering:
- Has tasks → `<TaskList tasks={...} showDelete={false} />` + "See all" link
- Empty → dashed border card with tap-to-add prompt

`showDelete={false}` because the dashboard widget is a preview — deletion
lives on the full `/app/tasks` page.

## Cross-feature import: dashboard → tasks

The dashboard's `todays-plan.tsx` imports `TaskList` from
`features/tasks/components/task-list.tsx`. This is a deliberate exception to
the "features don't import features" rule. See
[decisions.md ADR-0013](./decisions.md) for the pattern:

> Features may import a *widget-level* component from another feature (e.g.
> `TaskList`, `NoteCard`). Features may NOT reach into another feature's
> internals (actions, schemas, hooks, private components).

The dashboard is a *composer* of feature widgets. Widgets are the public
surface every feature exposes for embedding.

## Optimistic UI

`TaskRow` uses `useTransition` — the row dims (opacity-60) while the server
call is in flight. On success, `revalidatePath` re-fetches. On failure, a
toast surfaces the error and the transition ends without a state change.

For high-frequency toggle patterns (typing quickly across a checklist), this
feels snappy enough. If polling reveals user-perceived lag, upgrade to
`useOptimistic` for instant visual feedback — noted as a follow-up.

## What this module does NOT do (yet)

- **Recurring tasks** (daily/weekly repeats). Needs a `recurrence_rule jsonb`
  column + a nightly cron to materialize instances.
- **Sub-tasks / nesting**. Needs `parent_task_id` self-FK.
- **Reminders / notifications**. Needs a notification queue table + a worker.
- **Task editing UI** — the `updateTask` action exists but there's no edit
  form yet. The quick-add covers create; edit is Trash-and-recreate for MVP.
  Add a `<TaskEditDialog>` when needed.
- **Undo on delete**. Nice UX polish; use `sonner` action button + a client
  action that recreates from the last-deleted snapshot.

## Improvement ideas for later

1. **Full CRUD dialog** — long-press a row on mobile / right-click on desktop
2. **Drag reordering** for the same-day tasks (via `is_pinned` or a numeric
   `sort_index`)
3. **Bulk actions** — clear completed, reschedule to tomorrow, etc.
4. **Recurring rules** with RRULE-style syntax stored as jsonb
5. **Notification integration** — remind the user 30min before a due-timed task
6. **Streaks widget** — days-in-a-row where user closed all today's tasks
