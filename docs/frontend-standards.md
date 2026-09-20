# Kemist — Frontend Engineering Standards — V1

> **What changed in v1:** First issue. Codifies the frontend half of Engineering Plan V1 into working
> standards for two machines and two people. Records three version drifts from the plan that need a
> V2 amendment: Vite 5.x → 8.x, React 18 → 19, and Radix → Base UI primitives (the last already
> reflected in the stack record).

---

## Document authority

Authority on: stack, architecture, performance budgets, data flow, keyboard mechanics, testing,
definition of done. Takes visual rules from the Design System, which it does not override.

Precedence: Compliance → Engineering Plan → Brand Identity → Design System → **Frontend Engineering
Standards** → Screen Specs.

---

## 1. What this frontend is

A **thin client**. A Go single binary inside the shop owns an encrypted SQLite database and serves this
UI over the shop LAN to browser terminals. The UI holds no business data, no local persistence, and no
offline database of its own.

Everything follows from that. Requests return in single-digit milliseconds because the server is on the
same machine or the same LAN. There is no loading state in this product because there is nothing to
wait for.

Offline means *the shop's internet is down*, not *the node is unreachable*. Billing works fully
offline. That state is normal, not degraded, and the UI must express it that way.

---

## 2. Stack — locked

| | | Why |
|---|---|---|
| Build | **Vite** | Engineering Plan decision 012: `vite build` → `ui/dist` → `go:embed`; dev proxies to `:5173`. Not Next.js — there is no server to run |
| Framework | React 19 + TypeScript | |
| Styling | Tailwind v4 | CSS custom properties, `@theme inline` |
| Components | shadcn/ui on **Base UI** primitives | shadcn default since July 2026; `components.json` style `base-vega` |
| Grids | TanStack Table | Every grid, without exception |
| Server state | TanStack Query | The only cache |
| Charts | Recharts | |
| Icons | lucide-react | |
| i18n | i18next | |
| Tests | Vitest + Playwright | |

**Not permitted:** Redux, Zustand, MobX, CSS-in-JS, any component library other than shadcn/Base UI,
any date library heavier than what `Intl` provides, moment.js.

### Version drift to reconcile

| Plan says | Reality | Action |
|---|---|---|
| Vite 5.x | Vite 8.x | Take 8.x; amend the plan |
| React 18 | React 19 | Take 19; amended in repo docs |
| Radix primitives | Base UI | Already superseded in the stack record |

---

## 3. Architecture

### 3.1 The seam

```
src/mocks/seed.ts      the only data source today
src/api/client.ts      THE SEAM — reads mocks now, reads the node later
```

`client.ts` is the only file that knows where data comes from. **Nothing else may import from
`src/mocks/`.** A component importing the seed directly is a defect.

When the Go node lands, one file changes. That is the entire migration.

### 3.2 Layout

```
src/
├── api/client.ts              the seam
├── mocks/seed.ts              realistic Indian pharmacy fixtures
├── keyboard/
│   ├── registry.ts            single source of truth for shortcuts
│   └── useScope.ts            scope stacking
├── billing/
│   └── machine.ts             explicit billing state machine
├── components/
│   ├── ui/                    shadcn, CLI-managed, do not hand-edit
│   └── kemist/                the primitives (§4)
├── features/<screen>/         one folder per screen, error boundary each
├── lib/                       formatters, pure domain functions
└── i18n/                      en.json, ml.json
```

**`src/components/ui/` is CLI-managed.** Re-running `shadcn add --overwrite` destroys hand edits there.
Any Kemist-specific behaviour belongs in a wrapper under `components/kemist/`. The one exception
currently in the tree — the brand-hover fix in `button.tsx` — is a known fragility to migrate into a
wrapper.

### 3.3 Build order

Vocabulary before sentences. Building screens first produces a different row component on every screen.

1. **Primitives** — `GridRow`, `HotkeyChip`, `SyncChip`, `StatCard`, `NumCell`, `TotalsPanel`,
   `HintBar`, `ExpiryBadge`
2. **Shell** — app frame, left nav, top bar, keyboard registry, hint bar wired to it, Ctrl+K palette
3. **Dashboard** — first module
4. **Billing state machine** — alone, in its own session, with tests
5. **Billing screen and its states**
6. Everything else

### 3.4 Private registry

Once the primitives are stable, publish them as a shadcn-compatible registry and declare it in
`components.json`:

```json
{ "registries": { "@kemist": "https://registry.kemist.in/r/{style}/{name}.json" } }
```

The CLI substitutes `{style}` from `components.json`, so the registry can serve the right primitive
flavour. After this, every agent on every machine pulls *your* `GridRow` instead of inventing one. This
is the single highest-leverage step for consistency across two developers, and the one most likely to
be skipped because it feels premature at seven components. Do it at seven, not at twenty screens.

---

## 4. The keyboard contract

**The keyboard is the product, not a feature.** The billing window must be operable start to finish —
search, quantity, batch, payment, save, print — without the mouse ever being touched. A mouse-only step
anywhere in that path is a release blocker.

### 4.1 One registry, three consumers

```ts
type Shortcut = {
  scope: 'global' | 'page' | 'modal'
  key: string
  action: string
  description: string   // exact text shown in the hint bar
}
```

`src/keyboard/registry.ts` is a single declarative array driving **dispatch**, the **hint bar**, and the
**Ctrl+K palette**. Three consumers, one source.

**No `onKeyDown` handler may exist outside the registry.** The failure this prevents is drift: a
rebound key with a stale on-screen hint, which is worse than no hint because the user trusts it.

Scopes stack: global → page → modal. The innermost scope wins; unhandled keys fall through outward.

### 4.2 Rules

- Focus ring always visible. Esc backs out exactly one level. Focus never trapped.
- Barcode scanners deliver fast keystrokes terminated by Enter — detect by inter-key timing, not by
  input length.
- Every button carries its hotkey chip.
- Alt+1…9 reach the first nine nav items.

---

## 5. The billing state machine

Explicit machine with a typed state union. Not scattered handlers, not `useState` flags.

```
SEARCH → (⏎) QTY → (⏎) BATCH [FEFO preselected] → LINE_COMPLETE
       → (⏎) SEARCH … → (F5/F6/F7) PAYMENT → CONFIRM → PRINT → new bill

Esc    backs out exactly one state
F9     hold          F10  recall
F4     discount (permission-gated server-side)
```

Derive the mode from state rather than storing it — the existing prototype proved this works and it
makes desync structurally impossible.

**Rules taken from `docs/BEHAVIOUR-SPEC.md`, which is the authority:**

- Batch and expiry are mandatory on anything touching inventory. FEFO is the default batch.
- The oversell guard nets against quantity already committed to that batch on the current bill, not
  against raw stock on hand.
- Invalid quantities are **rejected, not clamped.** The bad value stays visible with an error. Silent
  correction teaches the user that the software is guessing.
- Money-touching mutations are pessimistic — await confirmation before showing a bill as saved or
  dispatching a print.

The marketing site's billing demo violates the last three. It is not a reference.

---

## 6. Performance budgets

These are the "fast and lightweight" requirement made measurable. Measured on pilot hardware — a cheap
shop PC, not a developer laptop.

| Budget | Target | Why |
|---|---|---|
| Search keystroke → candidate list rendered | **< 100ms perceived** | Below the threshold where typing feels laggy |
| Bill line added → totals updated | **< 50ms** | Must feel instantaneous |
| Bill save → print dispatch | **< 400ms** | Engineering Plan target |
| Initial bundle (gzipped) | **< 250KB** | Loads over shop LAN on old hardware |
| Route chunk (gzipped) | **< 80KB** | Lazy-loaded per feature |
| Grid at 5,000 rows | No dropped frames on scroll | Real stock files are this size |
| Cold load → billing usable | **< 2s** | The shop opens at 9am |

**Enforcement:** every grid with an unbounded row count is virtualised. Every feature route is
code-split. Bundle size is checked in CI, not by eye. Seed at least one grid with 5,000 rows
deliberately — a mock with eight rows hides every virtualisation bug until a real shop finds it.

---

## 7. Data and state

- **TanStack Query is the only cache.** Query keys `[entity, scope, params]`. No business data in
  `useState`, context or a global store.
- **No browser persistence.** No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies-as-storage
  for business data. The UI owns nothing. Per-viewer UI conveniences (last-used tab) are the only
  permitted exception and must be wrapped in try/catch and render correctly when empty.
- **Connectivity is a probe of the node's `/health`, never `navigator.onLine`.** The browser's flag
  reports the wrong thing on a LAN with no internet.
- **No hardcoded tax rates, HSN codes or invoice formats.** They come from an effective-dated rules
  engine. Historical bills always render with their historical rate. In the mock layer they live in
  `seed.ts` as *configuration*, never as constants in a component.
- **Permission checks are server-side.** Hiding a button is presentation, never a control. Never write
  a comment implying the UI enforces a permission.
- **Error boundary per feature route.** A crash in reports must not take down billing.

---

## 8. Testing

| Layer | Tool | Covers |
|---|---|---|
| Unit | Vitest | Keyboard registry, formatters, strip math, expiry banding, oversell guard |
| Component | Vitest + Testing Library | Primitives, focus behaviour |
| E2E | Playwright | **The zero-mouse billing test** |

**The zero-mouse test is the product's acceptance test.** It drives bill → item → quantity → batch →
payment → print with zero mouse events, against a real node and a fixture database. If it cannot pass,
the release does not ship.

**Prove every check fails before trusting it.** A green test that exercises nothing is worse than no
test — it manufactures confidence. This is not theoretical: `tsc --noEmit` against a root tsconfig with
`"files": []` passes on a broken codebase, which is why the typecheck script is `tsc -b --noEmit` and
why it was verified by deliberately breaking the code first. Apply the same discipline to the Playwright
test and to any lint rule added later.

---

## 9. Definition of done

A screen is done when all of:

1. Design System review gate passes, item by item, with a stated result per item
2. `pnpm typecheck && pnpm build && pnpm lint` clean
3. Every action reachable by keyboard, with the key visible on screen
4. Verified at 1366×768 and at 125% scaling
5. Strings in the i18n catalogue, layout survives a 40% longer Malayalam string
6. Data flows through `api/client.ts`; nothing imports the mocks directly
7. Unbounded grids virtualised and tested at 5,000 rows
8. Committed as a single screen-scoped commit

---

## 10. Working with Claude Code

Same protocol on both machines. This is what keeps two people and two agents producing one codebase.

1. **One screen per session.** `/clear` between screens. A session carrying four screens of history
   produces worse output than a clean one re-reading `CLAUDE.md`.
2. **Plan first, then execute.** Read the plan before approving. A wrong plan costs a paragraph; a
   wrong screen costs an hour.
3. **Verify the instruction was carried out.** Approving a multi-part plan is not the same as it
   being done. Items get dropped silently.
4. **Fix the rule, not the output.** A wrong screen is one screen; a missing line in the docs is every
   future screen.
5. **When it can't explain a failure, get a real trace.** Reasoning from a generic error message wastes
   more time than running the entry point directly.
6. **Say "stop, that's enough."** Agents have no sense of sufficiency and will keep verifying past the
   point of usefulness. Two or three tool calls for a lookup is normal; seven means it has stopped
   converging.
7. **Never approve `rm -rf` without reading the path.** Never blanket-approve a deletion or a `git add`.
8. **`git push` is manual.** Commits are fine; pushing is a human decision.

### Repo documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Agent entry point — repo mechanics, environment notes, pointers to the below |
| `docs/kemist-brand-identity.md` | Brand |
| `docs/kemist-design-system.md` | Visual and interaction rules — **replaces the old root `DESIGN.md`** |
| `docs/kemist-frontend-standards.md` | This document |
| `docs/kemist-screen-specs.md` | Screen specifications |
| `docs/BEHAVIOUR-SPEC.md` | Billing behaviour extracted from the retired prototype |

Delete the root `DESIGN.md` once `docs/kemist-design-system.md` is in place. Two sources of truth is
the problem these documents exist to solve.

---

## 11. Known environment notes

Machine-specific, recorded so nobody rediscovers them:

- `pnpm dlx` is unreliable on the founder's Windows machine — use `pnpm exec`. shadcn CLI is pinned as
  a local devDependency for this reason, which is better practice anyway.
- Root `tsconfig.json` carries a duplicate `paths` alias alongside `tsconfig.app.json`. Intentional:
  the shadcn CLI reads the root file directly and does not follow project references. Keep both in sync.
- Neither tsconfig sets `baseUrl` — TypeScript 6 hard-errors on it (TS5101). `paths` resolves relative
  to the tsconfig's own directory without it.
- `typecheck` is `tsc -b --noEmit`, not `tsc --noEmit`. The latter checks nothing here.
