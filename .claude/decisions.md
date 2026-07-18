# Architectural Decision Records (ADRs)

Append-only log of architectural decisions. Newest at the top. Every entry: **date · decision · why · alternatives considered.**

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
