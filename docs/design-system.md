# Kemist — Design System — V1

> **What changed in v1:** First issue. Supersedes the repo-root `DESIGN.md`, which should be deleted and
> replaced by this document at `docs/kemist-design-system.md`. Three changes from earlier working drafts,
> all deliberate: (1) brand is green `#127A4A`, blue is interaction-only — the claim that blue was the
> only brand colour is withdrawn; (2) near-expiry is now a four-band row tint **plus** a days badge,
> superseding the cell-only rule; (3) working-grid text is 14px, up from 13px, with row heights unchanged.

---

## Document authority

Authority on: layout, density, spacing, component design, state expression, motion, accessibility.
Takes colour values from Brand Identity. Does not govern code structure or performance — that is
Frontend Engineering Standards.

Precedence: Compliance → Engineering Plan → Brand Identity → **Design System** → Frontend Engineering
Standards → Screen Specs. Conflicts resolve upward and are flagged, never silently chosen.

---

## 1. Stance

**A calm instrument panel, not a website.** The reference register is Zerodha Kite: dense, quiet,
numeric, unornamented, instantly legible.

Density with clarity. Colour is information, never decoration. Nothing moves unless it must.

The test for any screen: *can a tired chemist, mid-queue, find what they need without reading?* If the
answer requires reading paragraph text, the screen is wrong.

---

## 2. The operating environment

Design for this, not for your monitor.

| | |
|---|---|
| Display | 1366×768, often at 125% Windows scaling |
| Panel quality | Cheap TN panels, washed out, poor viewing angles |
| Light | Fluorescent, often glare on the screen |
| User | Counter staff and pharmacist-owners; many first-generation software users |
| Input | Keyboard and barcode scanner. The mouse is slow and often not used |
| Context | A customer is waiting. Every second is visible to them |
| Session | Eight hours, six days a week, for years |

Consequences that are not negotiable: mobile-first layouts are wrong; single-column stacking is a
defect; hover-only affordances are unusable; low-contrast pairings vanish on these panels; anything
below 12px is unreadable at 125% scaling on a glare-lit screen.

---

## 3. Colour

### 3.1 Five colours, one job each

| Colour | Means | Appears on |
|---|---|---|
| **Green** `#127A4A` | Kemist / this is the action | Logo, primary buttons, active nav, completion |
| **Blue** `#2456E6` | Where you are | Focus ring, selected row, picking state, links |
| **Amber** `#B96A00` | Caution | Near expiry, pending sync, low stock |
| **Red** `#C6222F` | Stop | Expired, error, nil stock, void |
| **Neutral** | Normal | In stock, synced, healthy — *no colour at all* |

Two rules that make the system work:

1. **A state colour appearing where it does not encode state is a defect.** No green dividers, no blue
   headings, no amber icons for decoration.
2. **Never carry meaning by colour alone.** Always pair with an icon, a dot, or a text tag. These
   panels are washed out and some users are colour-blind.

### 3.2 Token layer

This is the canonical set. Copy it verbatim into `src/index.css`.

```css
:root {
  /* ---- Brand (identity + primary action) ---- */
  --k-brand:            #127A4A;
  --k-brand-hover:      #0D6039;
  --k-brand-bg:         #EFF7F2;
  --k-brand-line:       #CBE6D8;

  /* ---- Interaction (where you are) ---- */
  --k-interactive:      #2456E6;
  --k-interactive-hover:#1B44BF;
  --k-interactive-bg:   #F2F5FE;

  /* ---- Neutral chrome ---- */
  --k-bg:               #FAFAF9;
  --k-surface:          #FFFFFF;
  --k-surface-2:        #F4F4F3;
  --k-border:           #E4E4E2;
  --k-ink:              #1C1C1A;
  --k-ink-muted:        #6E6E6A;

  /* ---- State: transient success ONLY (see Brand Identity §3.3) ---- */
  --k-pos:              #178A50;
  --k-pos-bg:           #E9F6EF;

  /* ---- State: caution, banded for expiry ---- */
  --k-warn:             #B96A00;   /* amber ink on the 50/100 tints */
  --k-warn-700:         #8A5000;   /* amber ink on the 200 tint — contrast */
  --k-warn-50:          #FDF8EE;   /* 61–90 days */
  --k-warn-100:         #FBF0DC;   /* 31–60 days */
  --k-warn-200:         #F7E4BE;   /* ≤30 days   */

  /* ---- State: stop ---- */
  --k-neg:              #C6222F;
  --k-neg-bg:           #FCEBEC;   /* expired row tint */

  /* ---- Layout constants ---- */
  --k-row:              32px;      /* working grids */
  --k-row-admin:        40px;      /* admin lists */
  --k-topbar:           44px;
  --k-hintbar:          28px;
  --k-nav:              200px;
  --radius:             0.375rem;  /* 6px */
}
```

### 3.3 shadcn contract mapping

shadcn components read their own variable names. Map, do not rename.

```css
:root {
  --background: var(--k-bg);
  --foreground: var(--k-ink);
  --card: var(--k-surface);
  --card-foreground: var(--k-ink);
  --popover: var(--k-surface);
  --popover-foreground: var(--k-ink);

  --primary: var(--k-brand);              /* green — the action */
  --primary-foreground: var(--k-surface);

  --secondary: var(--k-surface-2);
  --secondary-foreground: var(--k-ink);
  --muted: var(--k-surface-2);
  --muted-foreground: var(--k-ink-muted);

  --accent: var(--k-surface-2);           /* shadcn's --accent is a NEUTRAL
                                             hover surface, not brand. Never
                                             put a brand colour here. */
  --accent-foreground: var(--k-ink);

  --destructive: var(--k-neg);
  --destructive-foreground: var(--k-surface);

  --border: var(--k-border);
  --input: var(--k-border);
  --ring: var(--k-interactive);           /* focus stays blue */

  --sidebar: var(--k-surface);
  --sidebar-foreground: var(--k-ink);
  --sidebar-primary: var(--k-brand);      /* active nav TEXT and left bar,
                                             never a filled pill */
  --sidebar-primary-foreground: var(--k-surface);
  --sidebar-accent: var(--k-surface-2);
  --sidebar-accent-foreground: var(--k-ink);
  --sidebar-border: var(--k-border);
  --sidebar-ring: var(--ring);
}
```

**The `--accent` trap.** In Kemist language "accent" once meant the brand colour. In shadcn it means a
neutral hover surface. They are not the same. Putting a brand colour in `--accent` turns every hover
state in the application brand-coloured. Guard this in review.

### 3.4 Dark theme

Deferred. Everything is a custom property so adding it later is one additional `:root` block and zero
component changes. Do not ship one now — a second theme doubles the review surface for no user benefit
on a shop PC that runs one browser window at full brightness all day.

---

## 4. Expiry — the banded system

Expiry is where a pharmacy quietly loses money, so it gets the most expressive treatment in the system.
Row tint and badge together: the tint works at a glance, the badge works for someone who cannot rely on
colour.

| Band | Row tint | Badge ink | Badge text |
|---|---|---|---|
| 61–90 days | `--k-warn-50` | `--k-warn` | `88d` |
| 31–60 days | `--k-warn-100` | `--k-warn` | `52d` |
| ≤30 days | `--k-warn-200` | `--k-warn-700` | `19d` |
| Expired | `--k-neg-bg` | `--k-neg` | `−12d` |
| >90 days | none | none | plain date, no badge |

**The whole row is tinted, not just the expiry cell.** This supersedes the earlier cell-only rule.
Reason: a chemist scanning the expiry screen should see a gradient — darkest at the top — and understand
the shop's exposure in one look, before reading anything.

Badge: 11px, tabular, right-aligned in its own column, 1px border in the band ink at 40% opacity,
background in the band tint. Always present when a band applies. Never colour-only.

```css
.k-expiry-badge {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid currentColor;
  text-align: right;
}
```

---

## 5. Typography

| Role | Size / weight | Notes |
|---|---|---|
| display-total | 28 / 700 | The grand total. The heaviest thing on any screen |
| h1 | 20 / 600 | Screen title |
| h2 | 16 / 600 | Section |
| body | 14 / 400 | Default |
| **grid cell** | **14 / 400** | Raised from 13px — legibility on washed-out panels |
| caption | 12 / 400 | Labels, metadata |
| hotkey chip | 11 / 500 | Uppercase, letterspaced. The one sub-12px exception |

Line height 1.45 body, 1.2 headings.

**No content text renders below 12px.** The 11px hotkey chip is the sole exception — it is a secondary
annotation, uppercase with letterspacing, never prose.

**`font-variant-numeric: tabular-nums` on every quantity, price, total, batch number and date.** No
exceptions. Proportional digits make columns of numbers unscannable, which defeats the purpose of a
grid.

**Money:** `₹` with Indian digit grouping — `₹1,23,456.78`, never `₹123,456.78`. Two decimals always.
Use `Intl.NumberFormat('en-IN', …)`; do not hand-roll grouping.

**Dates:** `DD-MM-YYYY`. Expiry as `MM-YYYY`.

**Alignment:** numbers right, text left. Never centre a number.

---

## 6. Density, spacing, shape

4px base unit. Padding 8 / 12 / 16. Page gutter 16.

| | Height | Text | Used in |
|---|---|---|---|
| Working grid row | 32px | 14px | Billing, stock, purchases, day book, expiry |
| Admin list row | 40px | 14px | Settings, users, devices, held bills |
| Top bar | 44px | 13px | Every screen |
| Hint bar | 28px | 11px | Every screen, pinned bottom |
| Left nav | 200px wide, 40px rows | 13px | Every screen |

Radius: 6px controls, 8px cards. `--radius-xl` and above are **deliberately undefined** — the system has
two radii and `rounded-2xl` / `rounded-3xl` are banned. A stray class renders square, which is visibly
wrong and gets caught in review.

**One shadow level only:** `0 1px 2px rgb(0 0 0 / .06)`. Depth comes from 1px borders. Stacked shadows
read as decoration and cost rendering time.

---

## 7. Component recipes

### Grid row
32px, 14px text, 1px bottom border, zebra using `--k-surface-2` on even rows. Focused row: background
tinted `--k-interactive` at 6%, plus a 2px left bar in `--k-interactive`. The focused row must be
identifiable from one metre.

### Hotkey chip
11px uppercase, 1px border, muted text, 2px 6px padding, no fill. Right-aligned inside buttons:
`Save ⏎`, `Hold F9`. Built on shadcn `Kbd`, wrapped — the stock component defaults to Mac glyphs
(`⌘ ⇧ ⌥`) and a filled `bg-muted`, both wrong here. Kemist chips say `F5`, `Ctrl`, `Enter`, `Esc`.

### Sync chip
Dot plus label. `● Up to date` in neutral ink. `● Syncing (3)` in `--k-warn`. `● Offline` in **muted
grey — never red.** Offline is normal operation for this product; red would teach the user to panic at
the correct behaviour.

### Stat card
1px border, 8px radius, no shadow. Label 12px muted, value 24px tabular, optional delta chip. Nothing
else — no icons, no sparkline inside the card, no coloured background.

### Totals panel
Label left 13px muted, value right 13px tabular, 1px divider, then the grand total: label 12px muted
uppercase, value 28px/700 tabular. The heaviest element on the screen.

### Hint bar
28px pinned bottom, `--k-surface-2`, 1px top border, 11px uppercase muted, left-aligned, spaced.
**Rendered from the shortcut registry, never hand-written.** A hint that disagrees with behaviour is
worse than no hint.

### Empty state
One line of text plus the key that fixes it. "No items. Press `/` to search." No illustration, no
mascot, no explanatory paragraph.

### Form field
Label above, 13px. Never placeholder-as-label. Required marked with the word "Required", not a red
asterisk alone. Error text 12px in `--k-neg`, below the field, stating the fact and the number.

### Toast
Bottom-right above the hint bar, 320px, one line, 13px, 1px border, minimum 6-second dwell, Esc
dismisses. Never used for errors that block work — those render inline at the point of failure.

### Status expression in grids
Always a dot plus a word, never a colour alone:
`● In stock` neutral · `● Low` amber · `● Nil` red · `● Expired` red

---

## 8. Charts

Recharts. `--k-border` gridlines, 13px tooltips, no gradients, no 3D, no legend where a direct label
will do.

**Semantic colour when series carry meaning; single hue when they do not.**

```css
--chart-1: #127A4A;  /* sales, positive flow */
--chart-2: #2456E6;  /* purchases, neutral flow */
--chart-3: #C6222F;  /* returns, loss */
--chart-4: #B96A00;  /* pending, at risk */
--chart-5: #5B82EE;  /* blue tint — categorical ramp */
```

Sales vs returns vs purchases: use the semantic colours, they mean something. Top-10 fastest movers:
one hue, because ten colours there is noise pretending to be information.

---

## 9. Motion

Transitions ≤120ms, only on state change — row added, payment confirmed, sync status flipped.

No entrance animation. No hover lift. No parallax. No ripple. No page transitions.

**No skeleton shimmer, no spinners, no progress bars on local data.** The server is on the same machine
or the same LAN. A shimmer is a lie about latency, and it trains the user to expect waiting that is not
happening.

---

## 10. Language

English and Malayalam. Malayalam strings run 20–40% longer.

Consequences: no fixed-width buttons, no fixed-width table headers, no truncated action labels, no text
baked into an icon. The left nav allows two lines at 40px rather than an ellipsis. Every label must
survive a 40% longer string without reflowing the layout.

Latin numerals in both languages.

---

## 11. Accessibility floor

- WCAG AA contrast on every pairing, verified against a washed-out panel, not a calibrated monitor
- Hit targets ≥32px; the grid row height counts as the target
- Correct at 125% Windows scaling
- The focus indicator is **never suppressed.** shadcn's `outline-none` paired with a visible
  `focus-visible` ring is acceptable because the ring remains. Removing the outline with no replacement
  is not.
- Every state colour paired with an icon, dot or text tag

---

## 12. Banned outright

**Visual:** gradients · glassmorphism · backdrop blur · glow · dark hero sections · `rounded-2xl` /
`rounded-3xl` · more than one shadow level · emoji as icons · illustration spots · mascots ·
empty-state artwork · Material ripple or FAB · avatars and profile photos · any accent colour outside
the token set · decorative use of green, amber or red

**Layout:** mobile-first or single-column stacking · hamburger menus · bottom tab bars · large hero
areas · generous whitespace in working grids · icon-only collapsed sidebars · fixed pixel widths on
anything containing a translatable string

**Behaviour:** `outline: none` with no replacement ring · hover-only actions · any action reachable
only by mouse · drag-and-drop as the sole path · skeleton shimmer · spinners on local data · modals
that trap focus or ignore Esc · toasts dismissing under 6 seconds · confirmation dialogs for reversible
actions · infinite scroll in any register

**Data:** Lorem ipsum · "Product A" · dollar signs · Western digit grouping · `MM/DD/YYYY` ·
proportional numerals in numeric cells · centred numeric columns · totals that do not match the lines
above them

**Copy:** marketing claims inside the app · exclamation marks · greetings · the user's name on the
dashboard · apologetic error text · the names PharmaOS / PharmOS / PharmOSX

---

## 13. Review gate

Run against every screen before accepting it. Any FAIL is regenerated, not patched.

**Keyboard**
1. Every action has a key path, and the key is visible on screen
2. Focus ring present and visible on every focusable element
3. Focused grid row identifiable from one metre
4. Hint bar matches the shortcuts the screen actually implements
5. No action revealed only on hover

**Density and type**
6. Working rows 32px, admin rows 40px
7. Grid text 14px; nothing below 12px except the 11px hotkey chip
8. Every numeric cell tabular and right-aligned
9. Every rupee figure in Indian grouping
10. Complete and uncropped at 1366×768 and at 125% scaling

**Colour**
11. Green appears only as brand, primary action, or transient success
12. No colour used as decoration anywhere
13. Every state colour paired with an icon or text tag
14. Offline chip muted grey, not red
15. Expiry uses the four-band row tint plus days badge
16. No colour outside the token set

**Behaviour and honesty**
17. No shimmer, spinner or progress bar on local data
18. Transitions ≤120ms, state changes only
19. Totals arithmetically match the lines above them
20. Statutory exports visibly ungated — no lock icon, no tier badge, in any licence state
21. Safe mode leaves exports and registers fully available and is not a takeover
22. No terminal count, quota or seat counter anywhere
23. "Kemist" appears; PharmaOS / PharmOS / PharmOSX do not

**Structure**
24. Data comes from the mock module via the API client, never hardcoded in a component
25. Every unbounded grid virtualised
26. Every user-visible string goes through the i18n catalogue
27. No business data in `localStorage`, `sessionStorage` or `IndexedDB`
