# Architectural Decision Records (ADRs)

Append-only log of architectural decisions. Newest at the top. Every entry: **date · decision · why · alternatives considered.**

---

## ADR-0021 · 2026-07-18 · Global search is ILIKE-per-table now, `to_tsvector` later

**Decision:** `/app/search` runs four parallel Supabase `.or(title.ilike.%q%, body.ilike.%q%)`
queries — notes, files, tasks, community_notes — limits each to 8 hits, and
groups them in the response. No FTS index. No search backend. No Postgres FTS
until a single user crosses ~10k rows in any one table.

**Why:**
1. ILIKE against columns already indexed by `updated_at DESC` returns fast for
   the scale we're at.
2. FTS complicates every mutation: every insert needs the trigram / tsvector
   updated. Not worth it for MVP.
3. The GIN index on `notes(to_tsvector(...))` from Module 4 is already there,
   so swapping this action for `.textSearch()` is a one-file change when we
   need it. Zero migration required.
4. All queries reuse the existing user_id + scope filters — RLS is unchanged.

**Trade-off accepted:** Cross-word matching ("cell strucher" won't find "cell
structure") isn't supported. Users must spell right. Fine for MVP.

**Alternatives considered:**
- Postgres FTS from day one: premature; migration + tsvector maintenance for
  6 tables is heavier than the win at current scale.
- MeiliSearch / Typesense: adds an external service + sync worker. Overkill.

---

## ADR-0020 · 2026-07-18 · Share-via-link uses a table column, not a share_events table

**Decision:** Notes gain `visibility text` and `share_token text unique` as
peer columns. Toggling visibility is a single `UPDATE`. The token is generated
by a Postgres `new_share_token()` function (16 random bytes → URL-safe base64).
Public reads land through an RLS policy that allows the anon key to select
rows where `visibility = 'link' AND share_token IS NOT NULL`.

**Why:**
1. Every note read already touches the `notes` table. Adding two columns is
   free at query time; a separate `share_events` table would add a JOIN.
2. Token generation in the DB keeps randomness bytes out of Node — no need to
   thread `crypto.randomBytes` through the action.
3. Turning sharing off should preserve the token so a user can toggle back on
   and reuse the same URL — a peer column supports this naturally, a separate
   events table would need soft-delete semantics.
4. Anonymous access is gated by the RLS policy alone. No custom endpoints,
   no signed URLs, no service-role queries.

**Trade-off accepted:** No open-count tracking today. Adding a `share_hits`
counter is a follow-up if we ever want it — cheap increment on the public read.

**Alternatives considered:**
- Random token per fetch (unique URL per session): breaks the "hand a link
  once" UX.
- Storing visibility as a boolean + separate token table: encodes the same
  info with more moving parts.

---

## ADR-0019 · 2026-07-18 · Workspace is the primary nav destination; `/app/dashboard` redirects

**Decision:** `Workspace` replaces `Home` as the first item in `APP_NAV_ITEMS`
and lands at `/app/workspace`. The old `/app/dashboard` route is kept but
`redirect()`s to `/app/workspace` so auth flows and external links don't 404.
Sidebar logo also targets `/app/workspace`.

**Why:**
1. The product frame is "personal study OS", not "dashboard app". A workspace
   with counts + categories + recent activity communicates that instantly;
   the old dashboard read as a marketing landing page.
2. Every existing content type (notes, files, tasks, quizzes, plans, evals,
   shares) needs a single entry point where a student can see what they have.
   Building this as one page is 1 module of work; scattering it across feature
   home pages would take many.
3. Removing `/app/dashboard` would break every auth-redirect target and every
   `revalidatePath("/app/dashboard")` call. Redirecting is safer and reversible.

**What we did NOT do:**
- **Delete `/app/dashboard`**: too much cascading breakage. Keep the URL alive
  as a permanent 302 to workspace.
- **Move dashboard widgets into workspace immediately**: `<GreetingHeader>`,
  `<TodaysPlan>`, `<ContinueHero>` are still useful — they'll migrate onto
  workspace as widgets during Module 23 (dashboard rebuild).
- **Add a new Storage bucket for uploads**: activity events are pure metadata,
  no bytes. The existing `study-files` bucket already handles file uploads
  (Module 8).

**Alternatives considered:**
- Keep dashboard as home + add Workspace as a 6th nav item: violates the
  5-item nav constitution and dilutes discoverability.
- Rebuild dashboard in place instead of adding workspace: mixes two shipping
  concerns (widget migration + workspace introduction) into one module.

---

## ADR-0018 · 2026-07-18 · Email OTP is the primary auth path; password is a fallback

**Decision:** `/login` and `/signup` show a two-step **email OTP** flow by
default (`sendEmailOtp` → 6-digit code → `verifyEmailOtp`). Password sign-in
remains available under a "Use password instead" toggle for existing users.
Google OAuth stays as-is above the divider on both screens. No phone/SMS
provider is configured — that's an explicit non-goal for MVP.

**Why:**
1. **Reliability on flaky mobile networks.** Clicking an email link launches
   the email app, the browser, and back — three chances for the flow to break.
   A 6-digit code stays in one tab.
2. **Zero incremental cost.** Supabase's built-in email OTP uses the same SMTP
   as the magic link. SMS would add a Twilio/MSG91 bill on every send — the
   Class 10 target audience doesn't justify it.
3. **Fewer support tickets.** Password reset is the #1 auth support burden;
   OTP eliminates it for the primary path. Existing users keep the password
   escape hatch so we don't break anyone.
4. **iOS/Android autofill.** `autoComplete="one-time-code"` + `inputMode="numeric"`
   means the OS surfaces the code straight from the notification bar — one tap
   and the field is filled.

**Trade-off accepted:** OTP-only accounts can't be logged in without email
access. That's the same constraint as magic-link and password-reset. The
password toggle exists so users who *want* a password can still set one via
signup (the password path writes both an OTP-eligible row and a password).

**Alternatives considered:**
- SMS OTP as primary: adds provider config, per-message cost, phone-number
  friction (India has a 10-digit + country-code UX to design). Not now.
- Passwordless-only (drop the toggle): breaks existing password accounts.
  Revisit when we have zero password users.
- Magic-link primary, OTP fallback: reverses the trade-off — the click-link
  UX we already have hasn't been reliable for the user, so we're flipping it.

---

## ADR-0017 · 2026-07-18 · i18n is per-user preference, not URL-routed

**Decision:** UI locale is resolved from `user_preferences.preferred_language`
via `lib/i18n/get-locale.ts` and threaded to `next-intl` in the root
`RootLayout`. No `/en/*` or `/pa/*` URL segments. Anonymous users see
`DEFAULT_LOCALE`. Namespace-based translations (`useTranslations("landing")`)
are the required pattern; global lookups are not allowed.

**Why:**
1. Nearly every page in StudyOS is behind auth. The locale is already known
   the moment a user is signed in — putting it in the URL duplicates state.
2. Deep links stay stable. Sharing `/app/notes/abc` with a peer works
   regardless of either user's chosen language.
3. URL-based locales force route duplication (`app/[locale]/*`), middleware
   complexity, and static-generation gymnastics with no offsetting benefit for
   an auth-gated SaaS.
4. Only the public landing at `/` matters for SEO. That page can add
   `hreflang` metadata in a future pass without moving off this decision.

**Rule:** All user-facing strings live under a namespace in
`lib/i18n/messages/{locale}.json`. Every component that renders text either:
- Server Component: `const t = await getTranslations("ns");`
- Client Component: `const t = useTranslations("ns");`

Nav items use a `labelKey` typed union — the renderer resolves it — never a
hardcoded label string on `NavItem`.

**Alternatives considered:**
- `next-intl` URL-based routing (`app/[locale]/*`): heavier, no user-facing win
  for an auth-gated app.
- A DIY hook reading from cookies: fails Server Components without threading
  the value through every RSC prop tree.

---

## ADR-0016 · 2026-07-18 · Reports are dismissed, never deleted; unpublish auto-dismisses

**Decision:** `community_reports` gains `dismissed_at` / `dismissed_by`
timestamps rather than a delete. The triage queue filters
`WHERE dismissed_at IS NULL`. Unpublishing an approved note automatically
dismisses every open report on that note inside the same server action.

**Why:**
1. Reports are an *audit trail*. If a note is later re-approved or an author
   disputes a moderation decision, the original reasons matter. Deletion
   destroys context.
2. A single teacher click that resolves a note (unpublish) should also resolve
   the reports that triggered it — otherwise the queue stays cluttered and the
   next teacher wonders whether action was taken.
3. Two separate actions (dismiss vs delete) would force teachers to decide
   between "keep evidence" and "clean queue". Soft-dismiss lets them do both.

**Trade-off accepted:** the queue aggregates reports per-note (one row per
reported note, `reports_count` shown as a badge). A teacher can't dismiss one
report while keeping others open — dismiss clears all open reports on that
note. This matches how moderators actually work (they act on the note, not on
individual reports) and keeps the UI honest.

**Alternatives considered:**
- Hard delete on dismiss: loses the audit trail; blocks contested-decision review.
- Per-report actions: over-designed for v1; teachers action on notes, not reports.
- Separate `moderation_actions` history table: nice for v3 when we add
  "reversal" flows, but premature now.

---

## ADR-0015 · 2026-07-18 · Community notes are snapshots, not live joins

**Decision:** `community_notes` copies `title`, `content`, `author_display_name`,
and scope columns from the source `notes` row at share-time. Deleting the
source note leaves the community copy intact (`source_note_id` is nullable +
`ON DELETE SET NULL`). Editing the source has no effect on the shared copy.

**Why:**
1. A shared note is a *social object*. Peers who liked or saved it should
   still see the exact thing they engaged with — not a moving target.
2. The moderation decision is made against a specific version. Retroactive
   edits would let authors sneak content past a teacher who already approved.
3. `auth.users` isn't queryable via the anon key. Snapshotting
   `author_display_name` on the row avoids a service-role join for every feed
   read. Trades a tiny bit of storage for a large drop in query complexity.

**Alternatives considered:**
- Live JOIN against `notes.title/content`: fails all three points above.
- Versioned history table (`community_note_versions`): overkill for v1;
  editing after share isn't a use-case we're supporting yet.

---

## ADR-0014 · 2026-07-18 · Teacher role on `user_preferences`, not a separate roles table

**Decision:** Add `user_role text not null default 'student' check (in ('student','teacher'))`
as a peer column on `user_preferences`. Do not introduce a `user_roles` table for the
primary audience type. Persist role via three touchpoints:

1. Signup form's `AudiencePicker` writes to `auth.user_metadata.role`.
2. `saveMyProfile` reads that metadata as fallback and upserts to `user_preferences.user_role`.
3. `getMyProfile` returns it as `profile.role` — every downstream feature reads it there.

**Why:** Role is 1:1 with the user and changes at most once (a student who becomes
a teacher). Every content query already joins `user_preferences` via
`getAcademicScope()`. Making role a peer column keeps queries flat — no extra join,
no extra RLS policy. A separate table is only justified when a user can hold
multiple roles simultaneously (admin, moderator) — that will land as a distinct
`user_roles` table when Community moderation ships in Module 11+.

**Alternatives considered:**
- Separate `user_roles(user_id, role)` table — over-engineered for a 1:1 field;
  costs a join on every profile read.
- Store role only in `auth.user_metadata` — metadata is opaque to RLS and can't
  be queried efficiently for admin dashboards.
- Encode role into `preferred_language` or a boolean `is_teacher` — string enum
  is clearer at both the SQL and TS level.

---

## ADR-0013 · 2026-07-18 · Features may import a peer feature's widget-level components

**Decision:** The strict "features don't import features" rule from ADR-0003
is relaxed for one narrow case: a feature (or a page-level composer like
`features/dashboard/`) may import a *widget-level* component from another
feature (e.g. `TaskList`, `NoteCard`). Features may NOT reach into another
feature's internals (`actions/*`, `schemas/*`, `hooks/*`, private components).

**Why:** Real product surfaces need to compose. The dashboard's "Today's plan"
card is a preview of the Tasks feature. Duplicating `TaskList` in
`components/shared/` splits its evolution — every fix has to happen twice,
and the two copies inevitably drift. Widget-level composition is the pattern
every mature React app uses.

**Rule:** Each feature exposes its widgets (component-level surface) as a
"public API". Actions, schemas, and hooks stay internal. If two features need
to share internals, promote to `lib/` or `hooks/` at the root.

**Alternatives considered:** Strict isolation via `components/shared/`
duplication (rejected — drift is worse than coupling); dependency-injection
via context providers (over-engineered for this scale).

---

## ADR-0012 · 2026-07-18 · Design tokens updated to Plus Jakarta Sans + `#5B5FDB` palette

**Decision:** Font family switched from Geist Sans to **Plus Jakarta Sans**.
Primary hue moved from `#491DE5` to `#5B5FDB`. Background from pure white to
warm cream `#F4F3EF`. Border from cool gray to warm cream `#EAE8E2`. Radius
scale bumped: `sm 8, md 12, lg 16, xl 20, 2xl 28`.

**Why:** The reference design (Claude Design → `StudyOS.dc.html`,
`StudyOS Onboarding.dc.html`) uses a warm, calm, education-focused aesthetic
that better matches the target audience (Class 10 Indian students) than the
Vercel/Linear cool minimalism we started with.

**Alternatives considered:** Keep original tokens (rejected — designer intent
is explicit; retrofitting later would touch every file).

---

## ADR-0011 · 2026-07-18 · Onboarding gate lives in `/app/*` layout, not middleware

**Decision:** Middleware handles auth only (fast, edge-friendly). The check
"has this user completed academic onboarding?" runs in `app/app/layout.tsx`
via `requireOnboardedProfile()`.

**Why:** Middleware runs at the edge and can't easily do a DB query per
request without adding latency to every route match. The layout is already
executing RSC per request and pays the DB cost anyway — `getMyProfile()` is
React-cached so downstream RSCs share the same query.

**Alternatives considered:** Middleware-level check (bad — adds latency to
every request), page-level check (bad — every future page would repeat it).

---

## ADR-0010 · 2026-07-18 · `preferred_language` is separate from `medium_id`

**Decision:** `user_preferences.preferred_language` is a distinct column from
`medium_id`. Medium governs the language of STUDY CONTENT (notes, papers,
flashcards). `preferred_language` governs the app's UI chrome (buttons, menus,
labels).

**Why:** A PSEB student may want to study in Punjabi but read app buttons in
English — this is common in bilingual settings. Coupling the two would force
false choices.

**Alternatives considered:** Single "language" field (rejected — conflates two
distinct user intents).

---

## ADR-0009 · 2026-07-18 · No hardcoded academic reference data

**Decision:** Boards, mediums, classes, and subjects are database rows. Adding
a new board is a migration INSERT — never a code change. UI enumerates from
the DB via `getReferenceData()`.

**Why:** StudyOS must scale to arbitrary boards across India (and eventually
other countries). Hardcoding "PSEB / CBSE" in code would require a release
every time we expand.

**Alternatives considered:** Enums in code (rejected — doesn't scale, doesn't
support internationalization).

---

## ADR-0008 · 2026-07-18 · Server env vars lazy-validated per feature

**Decision:** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are `.optional()` in the env
schema. The clients that consume them (`getSupabaseAdmin`, `getGeminiModel`) throw a clear
error at call time if the key is missing.

**Why:** These keys aren't needed until admin ops (Module N) and AI features (Module 9+)
ship. Requiring them at boot means dev can't start without keys the developer doesn't have
yet. Lazy validation preserves fail-fast at the actual usage site.

**Alternatives considered:** All-required (blocks dev), `SKIP_ENV_VALIDATION` escape hatch
(footgun in prod).

---

## ADR-0007 · 2026-07-18 · PWA foundations in Module 0, service worker deferred

**Decision:** Ship manifest, viewport meta, safe-area insets, and touch-action defaults
in Module 0. Service worker + offline cache deferred to a later module (likely alongside
Notes Library or Daily Tasks — the first features with meaningful offline value).

**Why:** Foundation of PWA (manifest, install prompt, mobile viewport) costs nothing now
and enables install-to-home-screen on day one. A service worker for a shell with no
content is complexity without benefit. Add it when there's a real cache story.

**Alternatives considered:** Ship `serwist`/`next-pwa` in Module 0 (premature — no cache
targets), defer manifest entirely (loses install affordance).

---

## ADR-0006 · 2026-07-18 · Mobile-first PWA is the primary target

**Decision:** StudyOS is a Progressive Web App designed for Class 10 students on budget
Android phones. Every page, component, and layout must be designed at 375px first,
progressively enhanced to tablet/desktop.

**Why:** Target user reality: cheap Android, one-handed on a bus, throttled 4G. Building
desktop-first and "making it responsive later" always fails these users. Encoding it as
constitutional prevents drift.

**Alternatives considered:** Desktop-first with adaptive breakpoints (well-worn but
consistently produces poor mobile UX), separate mobile app (splits the team and codebase
without proportionate benefit at this stage).

---

## ADR-0001 · 2026-07-18 · Tailwind CSS v4 with CSS-first tokens

**Decision:** Use Tailwind v4 with `@theme` in `globals.css` instead of `tailwind.config.ts`.

**Why:** v4 is stable, faster, and colocates design tokens with the CSS layer where they
belong. `@theme` gives us HSL semantic tokens that work for both light/dark without JS.

**Alternatives considered:** Tailwind v3 (mature but slower, config-in-JS split from CSS).

---

## ADR-0002 · 2026-07-18 · Server Actions over API routes

**Decision:** Default to Server Actions for all mutations. API routes reserved for webhooks,
streaming SSE, and third-party callbacks (e.g. Gemini streaming responses).

**Why:** Server Actions are type-safe end-to-end, avoid an extra network hop, and integrate
with revalidation. API routes force us to define request/response shapes twice.

**Alternatives considered:** tRPC (great DX, but Server Actions are now first-class and cover
our needs without the extra abstraction).

---

## ADR-0003 · 2026-07-18 · Feature-first folder structure

**Decision:** Business code lives in `features/{name}/{components,hooks,actions,schemas,types}`.
`app/` contains only route shells that compose from features.

**Why:** Scales past 13 modules. Each feature is a movable, deletable unit. Prevents the
`app/` directory from becoming a spaghetti mess.

**Alternatives considered:** Route-colocated code (breaks reuse), monolithic `components/`
(doesn't scale).

---

## ADR-0004 · 2026-07-18 · `Result<T, E>` for Server Actions

**Decision:** Server Actions return a typed `Result<T, ActionError>` instead of throwing.

**Why:** Errors become part of the type system. Client code must handle both branches.
Throwing across the RSC boundary produces poor UX (generic error boundary) and loses type info.

**Alternatives considered:** Throwing + error boundaries (opaque, hard to react to per-action).

---

## ADR-0005 · 2026-07-18 · Geist as the single font family

**Decision:** Geist Sans for UI, Geist Mono for code. No other fonts.

**Why:** Single family = consistent hierarchy. Geist is bundled by Vercel with zero-runtime
font loading. Matches the design north stars (Vercel, Linear).

**Alternatives considered:** Inter (excellent but adds a font request), system UI (inconsistent
across OS).

---

## ADR-0009 · 2026-07-18 · Restrict spacing scale

**Decision:** Enforce spacing values `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px only. Documented
in `ui-guidelines.md`.

**Why:** Consistent rhythm across the product. Prevents ad-hoc pixel pushing that erodes
design cohesion.

**Alternatives considered:** Tailwind default full scale (too permissive), a custom Tailwind
theme override (fragile, breaks arbitrary values).
