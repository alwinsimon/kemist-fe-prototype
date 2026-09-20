# Kemist — Plan Amendment Register — V1

> **What this is and why it exists.** Project-knowledge documents are read-only to me — I can read
> Product Plan V7 and Engineering Plan V1 but cannot rewrite them in place, and rewriting a long plan
> I can only partially see would introduce errors rather than fix them. This register instead records
> every amendment those documents now owe, with section references, so the next full rewrite
> (Product Plan V8, Engineering Plan V2) catches all of them in one pass rather than accumulating
> patches — which the locked documentation discipline forbids anyway.
>
> **Amendments accumulate here until a version rewrite consumes them.** Delete an entry only when it
> has landed in a published version.

---

## 0. Which document is canonical for what

Divergence between the repo and project knowledge is the exact failure this register exists to
prevent, so the rule is explicit:

| Document | Canonical copy | Updated by | Project knowledge holds |
|---|---|---|---|
| Brand Identity | `docs/brand-identity.md` in the repo | Claude Code, under review | A versioned snapshot, exported after each accepted change |
| Design System | `docs/design-system.md` | Claude Code | Versioned snapshot |
| Frontend Standards | `docs/frontend-standards.md` | Claude Code | Versioned snapshot |
| Screen Specs | `docs/screen-specs.md` | Claude Code | Versioned snapshot |
| Salt & Composition Model | `docs/salt-model.md` | Claude Code | Versioned snapshot |
| BEHAVIOUR-SPEC | `docs/BEHAVIOUR-SPEC.md` | Frozen — extracted from the retired prototype | Reference copy |
| **Product Plan** | **Project knowledge** | Manual rewrite, V7 → V8 | The canonical copy |
| **Pricing Plan** | **Project knowledge** | Manual rewrite | The canonical copy |
| **Engineering Plan** | **Project knowledge** | Manual rewrite, V1 → V2 | The canonical copy |
| This register | Project knowledge | Updated as amendments arise | The canonical copy |

Repo documents are working documents — they change as code changes, and git carries their history.
Plan documents are strategic and change by deliberate revision. Export the repo docs into project
knowledge as versioned snapshots when a milestone closes, not continuously.

---

## 1. Engineering Plan V1 → V2

### 1.1 Schema — salts (blocking)

**§315–316, the `products` table.** Currently:

```sql
id TEXT PRIMARY KEY, brand_name TEXT NOT NULL, generic_name TEXT,
composition TEXT,                    -- salt string, normalised
```

`composition TEXT` is removed. Replace with the `salts`, `salt_schedule_rule` (a bounded predicate,
not a flat `salt_schedule`), `product_composition` and `product_schedule_override` entities in
**Salt & Schedule Model V4 §3**. Resolve whether `generic_name` survives (V4 §13 open question 4).

**§328, the FTS5 index.** Currently covers `composition`. Narrow it: composition matching moves to a
trie over `salts.name` and `salts.aliases`, resolving to salt IDs. FTS5 retains brand, manufacturer
and aliases.

### 1.2 Schema — statutory snapshot (blocking, compliance)

Bill lines gain two snapshot fields written once at dispensing and never updated: the rendered
composition string, and the schedule classification in force at that moment. Register exports read
these, never the live salt master.

Without this, compliance gates **G7 and G8 fail** — a salt reclassification retroactively rewrites
historical Schedule H1, X and narcotics registers. Salt & Schedule Model V4 §5.

### 1.3 Search engine

**§491.** "Salt search: query a composition → all same-composition products, in-stock first" becomes
the three-tier model in Salt & Schedule Model V4 §10: same composition · same salts different
strength · contains salt.

**§487–488.** Add the salt trie alongside the brand trie.

### 1.4 Billing engine

**§472.** Schedule H/H1/X prompting logic currently reads a product attribute. It now evaluates
**any salt in the composition**, against classification in force at the dispensing date, resolved in
the layer order and returning the `{classification, complete, unspecified_salts}` pair specified in
Salt & Schedule Model V4 §4.

### 1.5 Drug master data

**§791, §797.** The open master-data dependency is unchanged, but the normalisation pipeline is
re-scoped: dirty composition strings map to ordered salt-ID sets **once at ingest**, not repeatedly at
query time. Unmapped strings go to a review queue — never guessed, because a wrong salt mapping is a
dispensing risk.

### 1.6 Stack version drift

| Plan says | Reality | Action |
|---|---|---|
| Decision 012: Vite 5.x | Vite 8.x | Take 8.x, amend the pin |
| React 18 | React 19 | Take 19 |
| Radix primitives | shadcn on Base UI, style `base-vega` | Already superseded in the stack record; update the plan text |

### 1.7 Frontend architecture

Engineering Plan §10 (UI architecture) now has four governing repo documents beneath it — Brand
Identity, Design System, Frontend Standards, Screen Specs — plus the Salt & Composition Model. Add
the precedence chain and the cross-reference so the plan points at them rather than restating them.

---

## 2. Product Plan V7 → V8

### 2.1 Salt search (§276)

"Search every field: brand, molecule/salt, strength, form, manufacturer, HSN, barcode, rack, aliases.
**Salt-based search** surfaces same-composition alternatives."

Extend: alternatives are now tiered into same-composition, same-salts-different-strength, and
contains-salt. Add that salts are first-class entities with their own properties, and that schedule
classification attaches to the molecule rather than the product.

### 2.2 Schedule registers (§114, §270)

Schedule H/H1/X register triggers derive from salt-level classification, effective-dated, snapshotted
at dispensing. Note the statutory consequence explicitly — the registers are immune to master-data
updates by design, not by accident.

### 2.3 Competitive positioning (§473)

Salt search already justifies part of the price premium against Vyapar and eVitalRx. Tiered
substitution strengthens that claim materially — it is the difference between "search by molecule" and
"tell me what I can legally swap this for." Worth stating in the differentiation argument, subject to
the §8 G12 caveat: do not claim master completeness until the master-data source is settled.

### 2.4 PWA / secure context (§2) — already outstanding

V7 assumes a PWA shell, but `http://kemist-<shopcode>.local` is not a secure context, so service
workers are unavailable on non-node terminals. Installer-generated `chrome --app` shortcuts were
proposed as the substitute. **This amendment predates the salt work and is still open.**

### 2.5 Safe mode / compliance gate G3 — already outstanding

G3 (safe-mode behaviour on plan expiry) is failing and blocks any short-term plan shipping. The
intended behaviour is now specified in Screen Specs §3.3 state G — design-locked, not yet implemented.

---

## 3. Design System and Screen Specs — applied in-repo

These are being applied by Claude Code directly and need no manual rewrite. Listed so the register is
complete, and so the project-knowledge snapshots get refreshed when they land.

| Change | Document | Status |
|---|---|---|
| Expiry bands widened; contrast table recorded | Design System §3.2, §4 | Applied |
| Amber badge ink unified to `--k-warn-700`; expired badge ink darkened | Design System §4 | In progress |
| Expiry badge anchored to the date, worded "71 days left" / "71 days" / "EXPIRED" | Design System §4, §7; Screen Specs state A | In progress |
| Dosage-form prefix badge, fixed-width, neutral | Design System §7 | In progress |
| Search/picker result row — 44px two-line, eleven mandatory fields | Design System §6, §7, §13; Screen Specs state A | Applied |
| Salt display rules — bound strengths, match highlighting, salt-level tags, overflow, tiered groups | Design System §7; Screen Specs state A; Salt Model §10-11 | Applied |
| `UNSPECIFIED` marker; `salt_schedule_rule` bounded predicate (incl. dose-banded); `product_schedule_override` entity defined | Design System §7; Salt Model §3-4; `src/mocks/seed.ts` | Applied |
| Conditional fourth dashboard attention register for drug-data alerts | Screen Specs §2; Salt Model §9 | Applied |
| Dolo 650 stock corrected 47 → 167 to reconcile with batch depth | Screen Specs §4 (`src/mocks/seed.ts` already reflects 167) | In progress |

---

## 4. Open decisions that block work

| # | Decision | Blocks | Owner |
|---|---|---|---|
| 1 | Does schedule classification vary by strength or dosage form for the same molecule? Check codeine | Drug master ingestion; salt schema shape | Needs pharmacist-regulatory input |
| 2 | Drug master source — licensed, scraped or built | M1 | Founder |
| 3 | Unit normalisation rules for strength equality (500mg vs 0.5g) | Tier-1 "same composition" matching | Engineering |
| 4 | Does `generic_name` survive on `products`? | Schema finalisation | Engineering |
| 5 | F-key map validated against Marg muscle memory | Billing keyboard registry | Founder — three AKCDA shops |
| 6 | ~~Conditional-classification rule expression — evaluated fields vs full expression~~ **Closed by design (Salt & Schedule Model V4 §3.3).** Bounded predicate columns (strength range, unit, dosage form), deliberately not an expression language — a wrong rule is a dispensing risk, and a pharmacist-regulatory reviewer who isn't a programmer must be able to read and verify every row. | Salt schema | Engineering + regulatory |

---

## 5. Known defects

| # | Defect | Where | Severity |
|---|---|---|---|
| 1 | `FIFO` badge labels FEFO behaviour | Live marketing site billing demo | Public-facing, factually wrong |
| 2 | `theme_color` `#127A4A` in manifest vs `#FAFAF9` in Next viewport config | Marketing site | PWA chrome inconsistent |
| 3 | Retired PharmOS naming persists in skill filenames and Engineering Plan V1 | Internal | Leaks into generated code |
| 4 | Marketing demo omits the oversell guard and clamps quantities instead of rejecting | Marketing site | Not a product defect — but must never be used as a behavioural reference |
