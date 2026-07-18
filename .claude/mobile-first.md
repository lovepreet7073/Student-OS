# Mobile-First Playbook

StudyOS is a **PWA**. Primary user: **Class 10 Indian student on a budget Android phone,
holding the device one-handed on a bus.** Desktop is a secondary experience.

## The pre-code checklist

Before writing any page or component:

1. How does it look at 375px?
2. Can it be used one-handed (thumb reach = bottom third of screen)?
3. Does it force unnecessary scrolling?
4. Can the UI be simpler?
5. Is there an existing primitive to reuse instead?
6. Does it obey the design tokens?
7. Is the implementation scalable & reusable?
8. Does desktop still look excellent without breaking mobile?

If any answer is "no" → redesign first, code second.

## Breakpoints (Tailwind defaults, keep them)

| Class | Min-width | Device                        |
| ----- | --------- | ----------------------------- |
| —     | 320px     | Small Android (test target)   |
| —     | 375px     | iPhone SE / cheap Android     |
| —     | 390px     | iPhone 12–15                  |
| —     | 414px     | iPhone Plus                   |
| `sm:` | 640px     | large phone landscape         |
| `md:` | 768px     | tablet portrait               |
| `lg:` | 1024px    | tablet landscape / small laptop |
| `xl:` | 1280px    | desktop                       |
| `2xl:`| 1536px    | wide desktop                  |

**Rule:** Base styles = mobile. `md:` = tablet. `lg:` and up = desktop.

## Touch targets

- Interactive elements: **minimum 44×44 px**.
- `Button` default `size="md"` (h-9 = 36px) is acceptable for dense desktop lists ONLY.
  For anything a student will tap, use `size="lg"` (h-10 = 40px min, wrap padding to 44).
- Spacing between adjacent tappables: **≥ 8px**.
- Bottom nav item hit area: **56×56 px**.
- FAB: **56×56 px** floating above bottom nav with 16px margin.

## Navigation patterns

### Mobile (`< md`)
- **Bottom navigation bar** — 3–5 destinations max. Sticky bottom, respect
  `env(safe-area-inset-bottom)`.
- **Sticky header** — 56px tall. Left: back or menu. Center: title. Right: primary action.
- **Slide drawer** — for anything that doesn't fit in bottom nav (settings, help, sign out).
- **FAB** — one primary create action per screen when it makes sense (New Note, Add Task).

### Tablet (`md`)
- Bottom nav still valid. May promote to top nav for landscape.

### Desktop (`lg+`)
- Sidebar (collapsible) OR top nav — never both.
- No bottom nav.

## Layout patterns

| Screen size | Layout                                    |
| ----------- | ----------------------------------------- |
| Mobile      | Single column, stacked cards              |
| Tablet      | 2-column grid where cards are dense       |
| Desktop     | 3-column dashboard, max content width 1280 |

## Typography sizes (mobile-first)

Body base: **16px** (never smaller — Android auto-zooms inputs below 16px).
Headings scale up at `sm:` and `md:` — never scale down at mobile.

## Forms — mobile rules

- Every text input:
  - `inputMode` set correctly (`numeric`, `email`, `decimal`, `tel`, `search`, `url`).
  - `autoComplete` set (`email`, `current-password`, `new-password`, `one-time-code`, `name`).
  - `enterKeyHint` set (`next`, `done`, `search`, `go`).
  - Min height **44px** (use `Input` with padding, never `text-xs` inputs).
  - Font size **≥ 16px** on the input itself (prevents iOS zoom-in on focus).
- Submit button: **full width on mobile**, `sm:w-auto` on larger screens.
- Password field: include a show/hide toggle at the trailing icon slot.

## Tables → cards

Never render a wide table on mobile. Two acceptable patterns:

1. **Stacked cards** — each row becomes a card with label:value pairs. Default.
2. **Accordion** — summary row expandable to details. Use for lists with >8 attributes.

Horizontal scroll is last resort and only if:
- The data is inherently tabular (a spreadsheet-like feature)
- We surface a "scroll for more" affordance

## Safe areas & PWA polish

- Any fixed bottom element (nav, FAB) must include `pb-[env(safe-area-inset-bottom)]`.
- Any fixed top element (sticky header) must include `pt-[env(safe-area-inset-top)]`.
- Sides: `env(safe-area-inset-left/right)` on full-width bars.
- No `overscroll-behavior: contain` unless intentional.
- Prevent double-tap zoom on interactive controls: `touch-action: manipulation`.

## Performance budget (mobile)

| Metric                        | Target       |
| ----------------------------- | ------------ |
| Lighthouse Mobile Performance | ≥ 90         |
| LCP                           | ≤ 2.5s (4G)  |
| INP                           | ≤ 200ms      |
| CLS                           | ≤ 0.1        |
| First-load JS per route       | ≤ 130 KB gz  |

Techniques (apply as needed, not preemptively):
- RSC by default. Push interactivity into small client leaves.
- Dynamic imports for heavy features (rich text editor, PDF viewer, chart libs).
- `next/image` with correct `sizes` — never a raw `<img>` for content.
- Debounce inputs (300ms) on search/filter.
- `React.memo` only after profiling shows benefit.
- Ship dark mode CSS without JS gate; use `next-themes` `enableSystem` to avoid FOUC.

## Testing every screen

Before marking done:

- [ ] 320px width: no horizontal scroll, no clipped text, primary CTA reachable
- [ ] 375px width: comfortable, thumb can reach primary actions
- [ ] 768px: layout adapts, uses tablet-appropriate density
- [ ] 1024px+: uses screen space without excess whitespace
- [ ] Portrait rotation: renders correctly
- [ ] Landscape phone: still usable
- [ ] Dark mode: parity with light mode
- [ ] Keyboard-only: fully operable
- [ ] Reduced motion: animations respect preference
- [ ] Contrast: text ≥ 4.5:1, UI ≥ 3:1

## The single question

> "Can a Class 10 student comfortably use this with one hand on a budget Android phone?"

If no → redesign.
