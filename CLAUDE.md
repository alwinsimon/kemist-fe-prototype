# CLAUDE.md — Kemist frontend

## What this repo is

The React frontend for **Kemist**, an offline-first billing and inventory ERP for independent retail
chemist shops in India. A Go single binary runs on one PC inside the shop, owns an encrypted SQLite
database, and serves this UI over the shop LAN to browser terminals.

Right now the Go node does not exist yet. This repo runs against a mock module and is being built
**as the real frontend**, not as a throwaway prototype. When the node lands, one file changes.

## The seam

```
src/mocks/seed.ts       the only source of data today
src/api/client.ts       reads from mocks now; reads from the node later
```

`client.ts` is the only file that knows where data comes from. **Nothing else may import from
`src/mocks/`.** If a component imports the seed directly, that is a defect — say so and fix it.

## Read before any UI work

The repo-root `DESIGN.md` is retired — `docs/design-system.md` replaces it. Four docs in `docs/` are
the binding contract, in precedence order (conflicts resolve upward, never silently chosen). Each
document carries its own version in its header, not in the filename, so these paths stay stable
across revisions:

1. `docs/brand-identity.md` — colour values, logo, typefaces, voice, vocabulary
2. `docs/design-system.md` — layout, density, spacing, component design, state expression, motion,
   accessibility, the review gate (§13)
3. `docs/frontend-standards.md` — code structure, performance
4. `docs/screen-specs.md` — per-screen specs

Read the relevant ones before generating, editing or reviewing any component. Where your instinct
and a doc disagree, the doc wins. Do not restyle anything "to look better".

Separately, `docs/BEHAVIOUR-SPEC.md` remains the authority on billing-screen *behaviour* (state
machine, quantity math, search ranking) — it governs logic, not visual design, and isn't one of the
four above.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui · TanStack Table · TanStack Query ·
Recharts · lucide-react · i18next.

Not Next.js. There is no server, no SSR, no API routes. The Go binary serves a static build.

## Hard rules

These come from the engineering invariants. Violating one blocks the change.

1. **No mouse-only paths.** Every action has a key and the key is visible on screen. A change to any
   billing-flow component that breaks keyboard operability is rejected.
2. **No browser persistence.** No `localStorage`, `sessionStorage`, `IndexedDB`, cookies-as-storage.
   The UI is a thin client and owns no data. Volatile React state only.
3. **TanStack Query is the only cache.** No Redux, no Zustand, no business data in `useState` or
   context. Query keys are `[entity, scope, params]`.
4. **Connectivity is never `navigator.onLine`.** It is a probe of the node's `/health` endpoint.
5. **No hardcoded tax rates, HSN codes, or invoice formats.** They are effective-dated config read
   from the rules engine. In the mock layer they live in `seed.ts` as config, not as constants.
6. **Batch and expiry are mandatory** on anything that touches inventory. FEFO is the default batch.
7. **Statutory exports are never gated.** No lock icon, no tier badge, no disabled state on any
   Tier-1 or Tier-2 export path, in any licence state.
8. **Permission checks are server-side.** Hiding a button in this repo is presentation, never a
   control. Never write a comment implying the UI enforces a permission.
9. **Error boundary per feature route.** A crash in reports must not take down billing.
10. **Money-touching mutations are pessimistic.** Await confirmation before showing a bill as saved
    or triggering a print.

## Design non-negotiables (summary — full detail in `docs/design-system.md`)

- Design at 1366×768. Not responsive to mobile. Single-column stacking is a defect.
- **Green (`#127A4A`) is the brand colour — logo, primary action, active nav.** Blue (`#2456E6`) is
  interaction only: focus ring, selected/picking row, links. The two never swap jobs. Amber =
  near-expiry/pending-sync. Red = expired/error/stock-out/void. "In stock"/"synced" render in
  neutral ink with no colour at all — normal state needs no colour, only exceptions do. Never colour
  alone — always pair with icon or text tag.
- **Expiry is a four-band row tint plus a days badge**, not a cell-only tint: 61–90d / 31–60d / ≤30d
  each get a progressively darker amber row tint and a badge (`88d`, `52d`, `19d`); expired gets the
  red row tint and a badge (`−12d`); >90 days gets no tint and no badge. The whole row is tinted, not
  just the expiry cell.
- **The offline chip is muted grey, never red.** Offline is normal operation for this product.
- `font-variant-numeric: tabular-nums` on every number. Indian grouping: `₹1,23,456.78`.
- Working grids: 32px rows, 14px text. Admin: 40px rows.
- Focus ring always visible. The focus indicator is never suppressed. shadcn's `outline-none`
  paired with a `focus-visible` ring is acceptable because the ring remains visible; removing the
  outline with no replacement is not.
- Transitions ≤120ms, state changes only. **No skeleton shimmer, no spinners** — local data renders.
- Every user-visible string goes through the i18n catalogue. Malayalam runs 20–40% longer than
  English, so no fixed widths on anything containing a string.

## Shortcut registry

`src/keyboard/registry.ts` is a single declarative array of `{ scope, key, action, description }`.
It drives **three** things from one source: key dispatch, the bottom hint bar, and the Ctrl+K
palette. Never add a `onKeyDown` handler outside the registry — hints would drift from behaviour and
that drift is the failure mode this design exists to prevent.

Billing is an explicit state machine, not scattered handlers:

```
SEARCH → (⏎) QTY → (⏎) BATCH[FEFO preselected] → LINE_COMPLETE
       → (⏎) SEARCH … → (F5/F6/F7) PAYMENT → CONFIRM → PRINT → new bill
Esc backs out exactly one state · F9 hold · F10 recall · F4 discount (permission-gated)
```

Barcode scanners arrive as fast keystrokes terminated by Enter — detect by inter-key timing.

## Naming

The product is **Kemist**. The names PharmaOS, PharmOS and PharmOSX are retired and must not appear
in code, comments, strings or filenames. Flag any occurrence you find.

## Components

Use the shadcn MCP server to look up components before writing them — do not guess props.
`Kbd` for hotkey chips · `Empty` for empty states · `Field` for labelled inputs ·
`Command` for the Ctrl+K palette · `Data Table` for grids · `Item` for list rows.

**Never install:** `Skeleton`, `Spinner`, `Progress`, or the `shimmer` utility. They imply latency
this product does not have, and shipping them would be a lie about how fast the node is.

## Working style

- Propose a plan and get it approved before writing code for any new screen.
- One screen per session. Commit after each accepted screen.
- After any UI change, run the review gate in `docs/design-system.md` §13 and report PASS/FAIL per
  item.
- When something conflicts with a rule above, stop and say so. Do not silently pick a side.

## Commands

```
pnpm dev          # Vite dev server
pnpm build        # static build the Go node will serve
pnpm typecheck    # tsc --noEmit
pnpm lint
pnpm test
```

## Known environment notes

- `pnpm dlx` is unreliable on this machine. Use `pnpm exec` instead.
- The root `tsconfig.json` carries a duplicate `paths` alias (`@/*`) alongside the same alias in
  `tsconfig.app.json`. This is intentional, not drift: shadcn's CLI reads the root `tsconfig.json`
  directly and does not follow project references, while `tsc`/Vite resolve the alias through
  `tsconfig.app.json`. Keep both in sync when the alias changes. Neither copy sets `baseUrl` —
  TypeScript 6 deprecated it (TS5101, hard error), and `paths` resolves relative to the tsconfig's
  own directory without it.
- Never run `git push`. Commits are fine; the user pushes manually.
