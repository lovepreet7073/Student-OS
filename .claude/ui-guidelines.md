# UI Guidelines

> **Mobile-first is the law of the land.** Read `mobile-first.md` before this file. This
> file covers the visual system; `mobile-first.md` covers responsive behavior.

## Design north stars

Vercel, Linear, Notion, GitHub, Stripe — for polish and restraint. Google/Instagram/Zomato
mobile PWAs for the touch patterns. Minimal. Premium. Fast. Thumb-friendly.

## Design tokens — source of truth

All tokens live in `app/globals.css` under `@theme`. Never hardcode a value that has a token.

## Color system (semantic, HSL, theme-aware)

Every color is a semantic token that resolves differently in light vs. dark mode.

| Token                  | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `background`           | Page background                               |
| `foreground`           | Default text                                  |
| `card` / `card-fg`     | Elevated surface + its text                   |
| `popover` / `popover-fg` | Floating surface (menus, tooltips)          |
| `primary` / `primary-fg` | Primary brand + text on it                  |
| `secondary` / `secondary-fg` | Secondary surface + text                |
| `accent` / `accent-fg` | Hover accents, subtle highlights              |
| `muted` / `muted-fg`   | De-emphasized surface + de-emphasized text    |
| `border`               | Divider & border color                        |
| `input`                | Input border                                  |
| `ring`                 | Focus ring                                    |
| `danger` / `danger-fg` | Destructive actions, errors                   |
| `success` / `success-fg` | Positive confirmations                      |
| `warning` / `warning-fg` | Cautions                                    |
| `info` / `info-fg`     | Neutral informational                         |

Use them via `bg-background`, `text-foreground`, `border-border`, etc.

## Spacing scale (px)

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64` — Tailwind classes `1, 2, 3, 4, 5, 6, 8, 10, 12, 16`.
Never use `p-7`, `p-9`, `p-11`, `p-14`, `p-20`, etc.

## Radius scale

`sm 6px`, `md 10px`, `lg 14px`, `xl 20px`, `2xl 28px`, `full 9999px`. Cards default `lg`.
Buttons default `md`. Pills use `full`.

## Shadows

Three levels only: `shadow-sm`, `shadow-md`, `shadow-lg`. Prefer borders over shadows for
low-elevation surfaces.

## Typography

Single family: **Geist Sans** (body/UI) and **Geist Mono** (code). No other fonts.

| Class     | Size / Line-height    | Weight | Use             |
| --------- | --------------------- | ------ | --------------- |
| `display` | 48px / 1.1            | 600    | Hero headlines  |
| `h1`      | 32px / 1.2            | 600    | Page titles     |
| `h2`      | 24px / 1.3            | 600    | Section titles  |
| `h3`      | 20px / 1.4            | 600    | Card titles     |
| `body`    | 16px / 1.55           | 400    | Default text    |
| `caption` | 14px / 1.5            | 400    | Secondary text  |
| `small`   | 12px / 1.5            | 500    | Metadata, badges|

## Motion

- Micro (hover, focus, small toggles): **150ms** `ease-out`
- Panels, modals, dropdowns: **250ms** `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Page-level transitions: **400ms** `ease-in-out`

Prefer transform + opacity over layout properties.

## States (mandatory for every async view)

Loading → Empty → Success → Error → Skeleton → Retry. Reuse `components/shared/*State`.

## Accessibility

- All interactive elements are keyboard-reachable with visible focus rings (`focus-visible:ring-2`).
- `aria-label` on icon-only buttons.
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text / graphics.
- Respect `prefers-reduced-motion` for non-essential animation.
- Every form input has a matching `<label>` (visually hidden if design demands it).

## Iconography

`lucide-react` only. Sizes: 14, 16, 20, 24. Stroke width 2. Inline with text: 16.

## Responsive breakpoints

Tailwind defaults, unchanged:

| Prefix   | Min-width | Purpose                          |
| -------- | --------- | -------------------------------- |
| _(base)_ | —         | mobile: 320–639px                |
| `sm:`    | 640px     | large phone landscape            |
| `md:`    | 768px     | tablet portrait                  |
| `lg:`    | 1024px    | tablet landscape / small laptop  |
| `xl:`    | 1280px    | desktop                          |
| `2xl:`   | 1536px    | wide desktop                     |

Design at 375px first, then `md:` for tablet, then `lg:+` for desktop. Never write
desktop styles as the base.

## Touch targets

- Interactive elements: min 44×44px. Prefer `Button size="lg"` for primary user actions.
- Adjacent tappables: ≥ 8px spacing.
- Bottom-nav items: 56×56px hit area.
- FAB: 56×56px, 16px from screen edge, above safe-area inset.

## Mobile navigation

- Bottom nav (fixed, respects `pb-safe`) — 3–5 items max.
- Sticky header (56px) — respects `pt-safe`.
- Slide drawer for overflow (settings, sign-out, help).
- FAB for the one primary create action per screen (optional).

Desktop uses sidebar OR top nav (not both). Mobile never sees a sidebar.

## Safe areas

Any fixed / absolutely-positioned bar or button must include the appropriate safe-area
utility: `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`, or the combined `px-safe`.

## Don'ts

- No inline `style={{}}` for anything the token system covers.
- No `<button className="...">` — use `<Button>`.
- No `<img>` for content — use `next/image` with correct `sizes`.
- No custom scrollbars, custom cursors, or flashy gradients.
- No emoji in production UI unless it's user-generated content.
- No `font-size < 16px` on inputs (iOS auto-zooms).
- No fixed pixel widths in mobile layouts — use fluid + max-width.
- No hover-only interactions (mobile has no hover).
