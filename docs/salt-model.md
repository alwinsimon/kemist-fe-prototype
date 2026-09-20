# Kemist — Salt & Schedule Model — V4

> **What changed in v4.**
>
> 1. **One switch, not two** (§1). V3's independent switches forced a product-level schedule fallback —
>    a second classification mechanism with its own data model, resolution path and tests, for a mode
>    almost nobody wants. **Withdrawn.** Schedule stays on the salt, always. What a shop actually wants
>    to control is how hard the prompt pushes, so the single switch carries a nested **capture
>    enforcement** setting: Required or Optional. On Optional, classification still happens, the bill
>    still snapshots it, the register is still producible — only the prompt becomes skippable, and the
>    skip is recorded.
> 2. **`UNSPECIFIED` is an explicit classification** (§3.4, §4). V3 read "no rules" as "not scheduled",
>    which held while Kemist owned the master. Once shops add their own salts, absence means *nobody has
>    looked yet* — the opposite meaning, indistinguishable in the same empty state. **Every salt now
>    carries at least one rule.** Zero rules is a data defect, not a semantic.
> 3. **Resolution returns a pair, not a value** (§4.4). `UNSPECIFIED` is orthogonal to the restriction
>    ladder — an absence of information, not a level of it — so resolution yields a classification plus
>    a completeness flag, and both are snapshotted.
> 4. **Register honesty rules** (§6). Disabled drug data must never produce an empty Schedule H1
>    register, which would read as a false statement rather than an absent one.
> 5. **Terms position settled** (§12). Reference data supplied as-is, best-effort; the pharmacist
>    remains responsible; use, modify or replace is the shop's decision. No completeness claim.
>
> **Supersedes** Salt & Composition Model V1, V2 and Salt & Schedule Model V3 in full, and Engineering
> Plan V1 §315–316, §328, §472, §491.

---

## Document authority

Authority on: the salt entity, composition, schedule classification and its resolution, the shop's
drug-data configuration, divergence alerting, register honesty, search and substitution semantics, and
composition display.

Precedence: Compliance → Engineering Plan → Brand Identity → Design System → Frontend Standards →
Screen Specs. Newer than all of them on these subjects; older documents are amended, never left in
conflict.

---

## 1. One switch, one nested setting

```
Drug data (salts, composition, schedules)     ON / OFF              default ON
    └─ Schedule capture                       Required / Optional   default Required
```

**Schedule always lives on the salt.** There is no product-level schedule flag, no second mechanism,
no alternative resolution path.

### 1.1 Why one switch and not two

Salts are passive; schedules are active. Salts *add* information — molecule search, substitution
groups — and nobody is annoyed by search capability they can ignore. Schedules *demand* something: a
prompt, fields, a bill that won't save. That is what shops want to control.

Two switches costs a second classification mechanism to serve salts-off-schedules-on, which is a mode
with almost no demand and a permanent maintenance burden.

One switch alone fails a real case: a shop that values molecule search but finds the H1 prompt slows
the counter has to surrender both to stop the prompting — and when they do, the classification record
disappears entirely. That is the worst outcome for the shop and for compliance.

The nested capture setting resolves it. The shop keeps search, keeps classification, keeps the record,
and controls only whether the prompt can be skipped.

### 1.2 What each setting does

| Setting | Classification | Prompt | Bill snapshot | Register |
|---|---|---|---|---|
| Drug data **ON**, capture **Required** | Resolved | Shown, must be completed | Full | Complete |
| Drug data **ON**, capture **Optional** | Resolved | Shown, `Esc` skips | Full, skip recorded | Produced, gaps marked |
| Drug data **OFF** | None | None | Marked not-enabled | §6.1 statement, never an empty table |

**A logged skip is an honest record** — *dispensed, prescriber not recorded*. Required capture yields
either a complete record or an off-system sale with no record at all, and a blocked sale at a counter
with a queue produces the second more often than anyone admits.

### 1.3 Turning it off

Salt screens, composition display and schedule prompting disappear — gone, not greyed out. A feature a
shop has declined should not occupy their attention.

Historical bills are unaffected. §5's snapshot rule means every register already produced stays
intact and correct.

---

## 2. Whose data

Independent of the switch, the shop chooses its source.

| Source | Behaviour | Divergence alerts |
|---|---|---|
| **Kemist master** | Ships with the node, updates through the config channel. Shop edits nothing. **Default** | N/A — nothing to diverge from |
| **Kemist master, modified** | Kemist's master plus the shop's corrections layered on top | Available, off by default |
| **Shop's own master** | The shop maintains its own. Optionally seeded from a Kemist snapshot, then independent | Available, off by default |

Kemist's master is **always present on the node**, even when unused — it costs almost nothing to store
and it is what makes divergence alerting possible if the shop later wants it. Present is not applied;
an unused master participates in no resolution.

### 2.1 The commercial position

Kemist supplies drug reference data on a best-effort basis and keeps it updated. It is **not**
represented as complete, authoritative, or a substitute for the pharmacist's judgement. The pharmacist
holds the licence and remains responsible for classification. Using, modifying or replacing the data is
the shop's decision. See §12.

---

## 3. Entities

### 3.1 `salts`

| Field | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Stable, never reused |
| `name` | TEXT | Canonical generic name, proper case in storage |
| `aliases` | TEXT[] | Spelling variants found at ingest |
| `source` | TEXT | `kemist` · `shop` |

### 3.2 `product_composition`

| Field | Type | Notes |
|---|---|---|
| `product_id` | TEXT FK | |
| `salt_id` | TEXT FK | |
| `position` | INT | Display order, 1-based |
| `strength` | NUMERIC | |
| `unit` | TEXT | `mg`, `mcg`, `g`, `ml`, `mg/ml`, `IU`, `%` |

Primary key `(product_id, position)`.

### 3.3 `salt_schedule_rule`

A bounded predicate, deliberately not a rule language. A wrong rule is a dispensing risk, and a
pharmacist who is not a programmer must be able to read and verify every row. Bounded columns are
auditable; an expression language is not. A fourth condition column later is a column; an expression
language later is a rewrite.

| Field | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `salt_id` | TEXT FK | |
| `schedule` | TEXT | `NARCOTIC` · `X` · `H1` · `H` · `NONE` · `UNSPECIFIED` |
| `min_strength` | NUMERIC NULL | Inclusive. NULL = no lower bound |
| `max_strength` | NUMERIC NULL | Exclusive. NULL = no upper bound |
| `strength_unit` | TEXT NULL | Required when either bound is set |
| `dosage_form` | TEXT NULL | NULL = any form |
| `effective_from` | DATE | |
| `effective_to` | DATE NULL | NULL = in force |
| `source` | TEXT | `kemist` · `shop` |
| `authority_ref` | TEXT NULL | Gazette notification, e.g. `G.S.R. 588(E), 30-08-2013`. Expected on `kemist` rows carrying a determined value |
| `reason` | TEXT NULL | Required on `shop` rows |
| `note` | TEXT NULL | Plain-English statement of coverage |

`authority_ref` is what lets a reviewer verify a rule against its source before it ships, what answers
a shop asking why the software wants a prescription, and what makes a master update a diff rather than
a guess. An inspector will look at the shop's register, not this field — it protects Kemist's data
quality, which is the more useful framing.

### 3.4 `UNSPECIFIED` — and why absence is no longer a state

Three distinct situations that V3 collapsed into two:

| State | Means | At the counter |
|---|---|---|
| `NONE` | Determined: not scheduled | Proceed silently |
| `UNSPECIFIED` | Nobody has determined it | Proceed, no prompt, raise an alert |
| `H` / `H1` / `X` / `NARCOTIC` | Determined: scheduled | Prompt per §1.2 |

**Every salt carries at least one rule.** Zero rules is a data defect, flagged at import and in the
integrity check — not a meaning. Specifically:

- A new shop-created salt gets one row: `schedule = UNSPECIFIED`, no bounds, effective today
- Paracetamol in Kemist's master gets one row: `schedule = NONE`, with a note recording that it was
  reviewed and is not scheduled
- A salt Kemist has catalogued but not yet classified ships as `UNSPECIFIED`

That last case is deliberate. Kemist will not have classified every molecule across four lakh SKUs on
day one. Shipping a catalogued-but-unclassified salt means molecule search works immediately while
classification catches up, and the shop's alert register shows exactly what is pending — more honest
and more useful than omitting the salt entirely.

### 3.5 `product_schedule_override`

A shop's decision about one product, in any direction including `UNSPECIFIED`.

| Field | Type | Notes |
|---|---|---|
| `product_id` | TEXT PK | |
| `schedule` | TEXT | Any value including `NONE` and `UNSPECIFIED` |
| `reason` | TEXT | Mandatory |
| `actor_id`, `actor_role` | TEXT | Pharmacist or Owner only |
| `effective_from` | DATE | Defaults today. **Never backdated** — backdating would rewrite history, which §5 exists to prevent |
| `created_at` | TIMESTAMP | |

### 3.6 What leaves `products`

`composition TEXT` is dropped and the FTS5 index no longer covers it. **No `schedule_flag` column** —
V3 specified one for the salts-off-schedules-on mode; that mode no longer exists. `generic_name`
survives only if it carries something composition does not.

---

## 4. Resolution

### 4.1 Layers, in order

```
1. product_schedule_override     the shop's decision about this product
2. shop salt rules               source = 'shop'
3. Kemist salt rules             source = 'kemist', if this shop applies them
4. no rule for this salt         → data defect, treated as UNSPECIFIED, flagged
```

The first layer producing an answer wins. Layers below are not consulted — which is what makes a
shop's decision stick rather than being merged with something else.

### 4.2 Matching a rule

Rules match on `salt_id`, the date inside the effective range, the strength inside the bounds where
bounds are set, and `dosage_form` matching or being NULL.

### 4.3 Most restrictive wins — among determined values only

```
NARCOTIC  >  X  >  H1  >  H  >  NONE
```

`UNSPECIFIED` is **not on this ladder.** It is an absence of information, not a level of restriction,
and ranking it would force a false choice between treating unknown as safe or as maximally dangerous.

Chosen so an ambiguous rule set fails safe. Rules need no ordering — a badly authored overlap produces
over-restriction, an inconvenience, rather than under-restriction, a breach.

### 4.4 Resolution returns a pair

```
{
  classification:     NARCOTIC | X | H1 | H | NONE
  complete:           bool
  unspecified_salts:  [salt_id]
}
```

- `classification` = most restrictive among salts resolving to a **determined** value
- If every salt is `UNSPECIFIED` → `classification = NONE`, `complete = false`
- `complete = false` if **any** salt is `UNSPECIFIED`

Worked:

| Composition | Result | At the counter |
|---|---|---|
| `PARACETAMOL (NONE)` | `NONE, complete` | Silent |
| `ALPRAZOLAM (H1)` | `H1, complete` | Prompt |
| `PARACETAMOL (NONE) + NEWSALT (UNSPECIFIED)` | `NONE, incomplete` | No prompt, alert raised |
| `ALPRAZOLAM (H1) + NEWSALT (UNSPECIFIED)` | `H1, incomplete` | Prompt **and** alert |
| `NEWSALT (UNSPECIFIED)` | `NONE, incomplete` | No prompt, alert raised |

### 4.5 `UNSPECIFIED` does not prompt

The tempting move is to treat unknown as restricted and prompt. **Don't.** A shop adds forty salts
during import, every product demands prescriber details, and they switch the feature off — losing the
classification record entirely, which is worse than the gap being closed.

Instead: no prompt, alert raised, and **the bill snapshots `UNSPECIFIED`.** The bill honestly records
*we didn't know*, not *it wasn't scheduled*, so the register can state a real gap rather than silently
absorbing it into the unscheduled pile (§6.4).

### 4.6 Unresolvable classification — LOCKED: prompt and log

Distinct from `UNSPECIFIED`. This is a salt that **has** determined rules, none of which match this
strength or form — a mis-entered band, typically.

Never blocks the sale. On a gap:

1. Apply the most restrictive classification among that salt's existing rules
2. Prompt for capture as if it applied
3. Write a `drug_data_alert` of type `unresolved_classification`
4. Complete the sale

Over-restricting achieves the regulatory outcome without a blocked sale at a counter with a queue.

---

## 5. The three statutory rules — LOCKED

**R1 — Classification is effective-dated.** Nothing reads schedule without a date.

**R2 — The bill line snapshots what applied at dispensing.** Written once, never updated:

| Snapshot field | Values |
|---|---|
| `composition_text` | The rendered string |
| `schedule` | The resolved classification |
| `complete` | From §4.4 |
| `capture_status` | `not_required` · `captured` · `skipped` · `not_determined` · `not_enabled` |

Salt IDs are stored too, for search and analytics — but **rendering history reads the snapshot, never
the live data.**

**R3 — Register exports read the snapshot.** Schedule H1, Schedule X, narcotics and every Tier 1 export
read stored values. They never recompute.

The failure these prevent: a molecule is reclassified in 2030; because registers recompute from current
data, three years of historical registers silently change, and a lawful 2027 sale appears as
non-compliance that never happened. This is the default unless the design prevents it.

Same pattern already locked for tax: historical bills always render at their historical rate.

### 5.1 The snapshot records the shop's own answer

Whatever the shop's configuration produced that day is what the bill records — including a
de-escalation, a skip, or an `UNSPECIFIED`. The register is an accurate account of **what the shop
decided and did**, not of what Kemist's master says now. That is correct: a register records
dispensing, and the shop's configuration was the operative rule at the time.

### 5.2 Master updates never overwrite shop configuration

A Kemist master update writes only to rows with `source = 'kemist'`. It never touches `source = 'shop'`
rows or `product_schedule_override`.

A shop's correction survives every update indefinitely without re-entry. This is what makes the
freedom real rather than nominal — flexibility silently reverted on the next update is worse than none,
because the shop stops trusting the system.

---

## 6. Register honesty

An absent register and an empty register say different things. **"No Schedule H1 sales this period" is
a statement, and if the shop had drug data switched off, it is a false one.**

### 6.1 Drug data off for the period

The export returns a statement, not an empty table:

> Schedule H1 register — 01-04-2027 to 30-06-2027
> Drug classification was not enabled for this period. No classification data was recorded.

Exportable, printable, honest. Never a table with zero rows.

### 6.2 Enabled or disabled mid-period

The register header carries the date, and rows appear only for the covered span:

> Classification enabled from 12-05-2027. Entries before this date were not classified.

### 6.3 Capture optional and skipped

The entry **exists** in the register, marked `prescriber not recorded`. A dispensing event with a
missing field is a recorded gap; omitting the row would be a false negative.

### 6.4 Incomplete classification

A separate closing statement rather than silence:

> 14 sales in this period involved products with unclassified molecules. These are listed in the
> unclassified annexe and were not assessed for Schedule H1.

This is why §4.5 snapshots `UNSPECIFIED` rather than collapsing it to `NONE`. Without the distinction
the register cannot make this statement, and the sales vanish into the unscheduled pile.

---

## 7. Shop configuration

### 7.1 Settings

```
drug_data_config
  drug_data_enabled          BOOL    default true
  schedule_capture           TEXT    required | optional      default required
  schedule_source            TEXT    kemist | kemist_modified | shop_own   default kemist
  divergence_alerts_enabled  BOOL    default false
```

`schedule_capture` is meaningful only when `drug_data_enabled`. `divergence_alerts_enabled` is
meaningful only when `schedule_source` is not `kemist`.

### 7.2 Permissions

| Action | Role |
|---|---|
| Change the switch, capture setting or source | Owner |
| Create or edit a shop salt rule | Pharmacist, Owner |
| Override a product's schedule, any direction | Pharmacist, Owner |
| View divergence alerts | Any role with inventory access |
| Anything at all | **Never Biller** |

### 7.3 Friction, not veto

Making a product **less** restricted than the applied master says — including setting it back to
`UNSPECIFIED`, which removes a prompt — carries:

- Pharmacist or Owner role
- Mandatory reason
- Audit entry typed `schedule_deescalation`, with actor, timestamp, before, after, reason
- A persistent marker on the product in inventory
- Inclusion in the divergence report

Not a confirmation dialog. A deliberate action on a settings screen, never something done mid-bill.

### 7.4 A consequence accepted deliberately

A shop can configure itself into a compliance gap — optional capture and de-escalation are both real
paths to dispensing a scheduled drug without a complete register entry. That is their licence and their
call. The design makes the correct path the default, every divergence visible and logged, and the audit
trail complete. What it must not do is pretend Kemist prevented something it cannot prevent (§12).

---

## 8. Divergence detection

Optional, off by default, meaningful only when the shop's data differs from Kemist's.

### 8.1 Classes

| Class | Meaning | Severity |
|---|---|---|
| `less_restrictive` | Shop says less restricted than Kemist | **High** |
| `shop_unspecified` | Kemist has a determined value, shop has `UNSPECIFIED` | **High** |
| `more_restrictive` | Shop says more restricted than Kemist | Info |
| `kemist_unspecified` | Shop has a determined value, Kemist has `UNSPECIFIED` | Info — the shop may be ahead of the master |
| `unresolved_classification` | §4.6 gap | Medium |
| `unclassified` | Both `UNSPECIFIED` | Medium |

`less_restrictive` and `shop_unspecified` sort first — both remove a prompt the master would have
raised. `kemist_unspecified` is useful in the other direction: a shop consistently ahead of the master
is a signal the master is behind.

### 8.2 When it runs

Nightly maintenance pass, on master update, and on demand from inventory. **Never during billing**, and
never on the billing path at all — a classification check that could slow a keystroke has no business
near the search field.

### 8.3 `drug_data_alert`

`id` · `product_id` · `salt_id` · `class` · `severity` · `shop_value` · `kemist_value` ·
`detected_at` · `acknowledged_at` · `acknowledged_by`

Acknowledged alerts leave the register but stay in the table. An alert reappearing after
acknowledgement because the master changed is a **new** alert, not a resurrected one.

---

## 9. Where alerts surface

**Never in billing.** Not as a banner, toast, row tint or badge. The biller cannot act on a
data-quality problem with a customer waiting, and showing it there trains people to dismiss warnings.

**Dashboard — a fourth attention register.** Screen Specs §2 specifies three: expiring in 30 days,
out-of-stock fast movers, credit due this week. A fourth, **Drug data**, appears **only when there are
unacknowledged alerts**; with none, the three widen to fill the row. An empty queue earns no permanent
space on a screen read 400 times a day.

Rows: product · class · shop value → Kemist value · detected. Sorted by severity. Enter opens the
product. Header carries a count.

**Inventory — a per-product marker.** A product with an alert or an active override shows a muted
marker in the status column and a dotted-underlined schedule chip. The detail pane shows which layer
produced the classification, what the other layers say, and the override's reason and actor. This is
where a pharmacist reviews and decides.

**Settings — a divergence report.** Full list, filterable by class, exportable. The shop's view of its
own exposure, on demand, in one place.

---

## 10. Search and substitution

**Index.** Trie on brand and aliases. Trie on salt name and salt aliases, so typing a molecule is as
fast as typing a brand. FTS5 narrowed to manufacturer and remaining free text. Salt matches resolve to
salt IDs, making product matching an integer set operation.

**Tiered alternatives**, replacing Engineering Plan §491's single group:

| Group | Match rule | Meaning |
|---|---|---|
| **Same composition** | identical salt set and strengths | True substitute |
| **Same salts, different strength** | salt set matches, strengths differ | Needs a decision |
| **Contains `<SALT>`** | at least one salt matches | Broader alternatives |

Salt set comparison is order-independent. Strength comparison exact after unit normalisation. In stock
first within each group; out of stock sorts last with a `Nil` tag.

With drug data off, search falls back to brand, manufacturer and aliases, and no alternatives group
appears.

---

## 11. Display

Extends Design System §7.

**Bind strength to salt.** `PANTOPRAZOLE 40mg + DOMPERIDONE 30mg`. The `+` separates salts; nothing
separates a salt from its own strength. Positional pairing is a dispensing risk, not a formatting
preference.

**Match highlighting.** A salt matched by the query renders in `--k-ink`, the rest in `--k-ink-muted` —
answering *why did this row appear when I typed something not in its name?*

**Salt-level schedule tags**, immediately after the strength:
`CHLORDIAZEPOXIDE 5mg [H1] + CLIDINIUM 2.5mg`. Red outline, never filled.

**`UNSPECIFIED` marker.** A muted `?` chip after the strength, neutral not red — it is missing
information, not a warning. Shown in inventory and product master. **Not shown in billing**, where it
would be noise the biller cannot act on.

**Override marker.** Dotted underline in inventory and product master. **In billing it renders as a
normal tag** — the biller needs the classification, not its provenance.

**Overflow.** Never truncate a salt name mid-word; a half-rendered molecule looks like a different
molecule. Show complete salt-and-strength pairs, then a muted `+2 more` chip, expandable by key.

**Drug data off.** Line 2 of the search row drops composition, showing manufacturer, batch, expiry and
rack only. The row stays 44px and two-line — layout does not change with configuration.

---

## 12. Compliance gate

| Gate | Verdict | Note |
|---|---|---|
| G1 — DPDP fiduciary mapping | **N/A** | Reference data only |
| G2 — Consent & notice | **N/A** | No personal data |
| G3 — Data-principal rights | **PASS** | Rights over H1 register entries unaffected; works in safe mode |
| G4 — Raw vs derivative split | **PASS** | No telemetry in this version. A future divergence signal would carry product and salt identifiers only — never bill, patient or prescriber data |
| G5 — India residency | **PASS** | Master ships via the config channel |
| G6 — Breach readiness | **N/A** | No personal data, no new key custody |
| G7 — GST §36 | **PASS** | R2 locked; historical bills render historical values |
| G8 — Drug-regulatory registers | **PASS** | R1–R3 locked; "any salt" trigger; most-restrictive-wins among determined values; prompt-and-log; **§6 honesty rules prevent a false empty register**. Registers record what the shop's configuration produced, which is the correct account of dispensing |
| G9 — Licensing reality | **PASS** | Configuration is shop-scoped, consistent with licence binding |
| G10 — Export posture | **PASS** | Registers complete, ungated, reading snapshots. §6.1's statement export is honest, not degraded |
| G11 — Encryption & key custody | **N/A** | Reference data |
| G12 — Claims & marketing | **CONDITIONAL — terms clause required** | Below |

**G12.** Shops can relax a classification and can make capture optional, so Kemist must not represent
the master as complete or authoritative. Required before launch:

- A terms clause: drug reference data is supplied **as-is on a best-effort basis**; the **pharmacist
  remains responsible for classification**; **using, modifying or replacing it is the shop's decision**
- No marketing claim of completeness, authority, or guaranteed compliance
- Salt search remains claimable as a differentiator — it is one, and tiered substitution strengthens it

Claiming completeness would move liability onto Kemist for nothing in return.

**Overall: CLEAR**, conditional on the G12 terms clause and on implementing R1–R3, §4.4–4.6, §5.2 and
§6.

Structured self-review against the project's regulatory frame, not legal advice. The terms clause wants
counsel.

---

## 13. Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| 1 | Which molecules carry concentration- or form-dependent classification, and at what bounds? Codeine first | Master seeding, not the schema | Pharmacist-regulatory reviewer |
| 2 | Unit normalisation — mg/mcg/g/ml/IU/%, and whether `%` can be compared to an absolute strength at all | Tier-1 matching; bound evaluation | Engineering |
| 3 | Drug master source — licensed, scraped or built | M1. Engineering Plan §791 | Founder |
| 4 | Does `generic_name` survive on `products`? | Schema finalisation | Engineering |
| 5 | Terms clause wording for §12 | Launch | Founder + counsel |
| 6 | Should shops be able to send divergence signals back to Kemist, opt-in, as a master-quality feed? Deferred until the freedom question settled — it now has | Phase 2 | Founder |
| 7 | Switching source to `shop_own` — seed from a Kemist snapshot or start empty? Recommend offering both, defaulting to seeded | Settings screen | Founder |
| 8 | Should `schedule_capture = optional` be visible to the shop as a risk statement on the settings screen, beyond the audit trail? | Settings screen | Founder |
