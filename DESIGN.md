# DESIGN.md — Kemist Pharmacy ERP

> Portable design contract. Import into Google Stitch as `DESIGN.md`, paste as the first message in v0, or
> save to the repo root as agent context for Claude Code / Cursor. Every generated screen must obey this file.
> Where a generator's default styling conflicts with anything here, this file wins.

## Product

Kemist is an offline-first billing and inventory ERP for independent retail chemist shops in India (Kerala
first). A Go binary runs on one shop PC and serves a React UI to browser terminals on the shop LAN. The UI is
a thin client — it holds no business data of its own.

## Users

Counter staff and pharmacist-owners in small Indian pharmacies. Often first-generation software users, often
on cheap 1366×768 panels under fluorescent light, always under queue pressure. They are fast on a keyboard and
slow with a mouse. They are not impressed by design; they are impressed by not having to think.

## Design stance

**A calm instrument panel, not a website.** The reference register is Zerodha Kite: dense, quiet, fast,
numeric, unornamented, and completely legible at a glance. Nothing moves unless it must. Nothing is coloured
unless the colour means something.

## Target stack (non-negotiable)

React 19 + TypeScript · Tailwind · shadcn/ui (Base UI primitives) · TanStack Table for every grid ·
TanStack Query as the only cache · Recharts for the few charts · lucide-react icons.
No Redux. No localStorage/IndexedDB. No CSS-in-JS. No UI library other than shadcn/Base UI.

## Viewport

Design at **1366×768 first**. Must survive 125% Windows scaling. Mobile is not a target and mobile-first
layouts are wrong for this product. Single-column stacking is a defect, not a responsive feature.

## Colour tokens

```css
--bg:         #FAFAF9;  /* app background, warm neutral */
--surface:    #FFFFFF;  /* cards, grids */
--surface-2:  #F4F4F3;  /* zebra rows, wells */
--border:     #E4E4E2;
--ink:        #1C1C1A;  /* primary text */
--ink-muted:  #6E6E6A;
--accent:     #2456E6;  /* primary action, focus ring, links — the ONLY brand colour in the app */
--accent-hover:#1B44BF;
--pos:        #178A50;  /* success / synced / in-stock */   --pos-bg:  #E9F6EF;
--warn:       #B96A00;  /* near-expiry / pending sync */    --warn-bg: #FCF3E3;
--neg:        #C6222F;  /* expired / error / stock-out / void */ --neg-bg: #FCEBEC;
```

**Colour is information, never decoration.** Chrome is neutral. Red only means expiry, error, stock-out or
void. Amber only means near-expiry, warning or pending sync. Green only means success, synced or in-stock.
Never carry meaning by colour alone — always pair with an icon or a text tag, because many of these monitors
are washed out and some users are colour-blind.

Build with CSS custom properties so a dark theme later costs nothing. Do not ship a dark theme now.

## Typography

- Face: `Inter, "Noto Sans Malayalam", system-ui, sans-serif`
- **`font-variant-numeric: tabular-nums` on every quantity, price, total, batch number and date.** No exceptions.
- Scale (px/weight): display-total 28/700 · h1 20/600 · h2 16/600 · body 14/400 · grid cell 13/400 ·
  caption 12/400 · hotkey chip 11/500 uppercase
- Line height 1.45 body, 1.2 headings. Nothing renders below 12px anywhere.
- Money: `₹` with Indian digit grouping — `₹1,23,456.78`, never `₹123,456.78`. Dates `DD-MM-YYYY`.
- Numeric columns are right-aligned. Text columns are left-aligned. Never centre a number.

## Spacing, shape, depth

4px base unit. Component padding 8/12/16. Page gutter 16. Radius 6px on controls, 8px on cards.
Grid rows: **32px compact** in working grids (billing, stock, purchases), 40px comfortable in admin screens.
One shadow level only: `0 1px 2px rgb(0 0 0 / .06)`. Depth comes from borders, not stacked shadows.

## Keyboard

The keyboard is the product. Every action reachable without a mouse; a mouse-only step is a defect.

- Focus ring always visible: 2px solid `--accent`, 2px offset. **Never** `outline: none`.
- The focused grid row is findable from one metre: accent-tinted background plus a 2px left accent bar.
- A persistent 28px hint bar is pinned to the bottom of every screen showing the currently active shortcuts.
- `Ctrl+K` opens a command palette. Buttons carry a hotkey chip (`Save ⏎`, `Hold F9`).
- `Enter` advances, `Esc` backs out one level. Focus is never trapped.

## Motion

Transitions ≤120ms and only on state change (row added, payment confirmed, sync status flip). No entrance
animations, no hover lifts, no parallax, no ripple. **No skeleton shimmer** — this data comes from a local
process on the same machine and is fast enough to simply render.

## Language

English and Malayalam. Malayalam strings run 20–40% longer. No fixed-width buttons, no fixed-width headers,
no truncated action labels, no text baked into icons. Latin numerals in both languages.

## Component rules

- **Sync chip:** `● Up to date` (pos) / `● Syncing (3)` (warn) / `● Offline` (**muted grey, never red** —
  offline is normal operation for this product, not an error).
- **Expiry in grids:** expired row = `--neg-bg` row tint + `EXPIRED` tag + neg text on the expiry cell.
  ≤90 days = `--warn-bg` on the expiry cell **only** — never tint the whole row amber.
- **Forms:** label above field, 13px. Never placeholder-as-label. Required marked with the word "Required",
  not just a red asterisk. Error text 12px neg, below the field.
- **Empty states:** one line of text plus the key that fixes it — "No items. Press `/` to search." No
  illustrations, no mascots, no empty-state art.
- **Stat cards:** label 12 muted / value 24 tabular / delta chip pos-or-neg. Nothing else.
- **Charts:** `--border` gridlines, single-hue series, no gradients, no 3D, no legends where a direct label
  will do, 13px tooltips.

## Accessibility floor

WCAG AA contrast minimum on every pairing, verified against a washed-out panel. Hit targets ≥32px (the grid
row height counts as the target). Works at 125% Windows scaling. The focus ring is a navigation instrument,
not a style choice — it is never suppressed.

## Banned outright

Gradients · glassmorphism · blur · dark hero sections · rounded-2xl/3xl cards · shadow stacks · emoji as
icons · illustration spots · Material Design ripple or FAB · mobile-first stacking · skeleton shimmer ·
hover-reveal actions · `outline:none` · centred numbers · decorative colour · marketing copy inside the app ·
any step that requires a mouse.
