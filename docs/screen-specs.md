# Kemist — Screen Specs — Shell, Dashboard & Billing — V1

> **What changed in v1:** First issue. Specifies the global shell and the first two modules in build
> order. Billing is specified to the level of the keyboard state machine because it is the only screen
> where "looks right" and "is right" come apart.
>
> **Amendment:** State A (product search open) now specifies the mandatory eleven-field, two-line,
> 44px result row (Design System §7) in place of the earlier five-field 32px row. Seed data (§4) now
> carries all eleven fields per product.

---

## Document authority

Authority on: what each screen contains and how it behaves. Takes colour from Brand Identity, layout
and density from the Design System, architecture and keyboard mechanics from Frontend Engineering
Standards. Where this document appears to contradict any of those, they win and this document is
wrong — flag it.

---

## 0. Build order and why

**Shell → Dashboard → Billing state machine → Billing screen → Billing states.**

The dashboard first because it is lower-risk and exercises every primitive: stat cards, grids, charts,
navigation, the keyboard registry. Getting the vocabulary right on a screen where mistakes are cheap
means billing inherits a working system instead of debugging one.

The billing state machine before the billing screen, in its own session, with tests. It is the only
artefact here that no generator produces correctly unprompted.

---

## 1. Global shell

Wraps every screen. Build once.

### Top bar — 44px, surface, 1px bottom border

**Left:** Kemist wordmark 14px · shop name 13px · terminal as a muted chip (`Counter 2`)
**Right:** sync chip · operator chip (`Anju · Biller`) · muted `Ctrl K` hint

Sync chip states — `● Up to date` neutral ink · `● Syncing (3)` amber · `● Offline` **muted grey**.
Offline is never red.

### Left nav — 200px, surface, 1px right border, 40px rows, 13px labels, 16px lucide icons

```
Billing · Held bills · Returns · Purchases · Stock · Expiry ·
Parties · Day book · Reports · Registers · Users · Settings
```

Active item: brand-green text plus a 2px left bar in brand green. Background unchanged — **not a
filled pill.** Access key as an 11px muted chip on the right, Alt+1 through Alt+9 for the first nine.

No collapse toggle, no icon-only mode, no nested flyouts. Two lines at 40px rather than an ellipsis
when a Malayalam label runs long.

### Hint bar — 28px pinned bottom

Rendered from the shortcut registry. Never hand-written.

### Command palette — Ctrl+K

560px wide, anchored 120px from top, 8px radius, one shadow level. 44px input, then 32px grouped rows:
**Go to** (screens) · **Actions** (New bill, Hold, Recall, Backup now, Export GSTR-1) · **Products**
(live search) · **Bills** (by number). Each row shows its own shortcut. First row preselected. Footer:
`↑↓ Navigate   ⏎ Open   Esc Close`.

---

## 2. Dashboard

### Purpose

The screen that opens on login. Its job is **"what needs my attention today"** — not a report, not a
welcome. A shop owner should know within three seconds whether anything is wrong.

Resist making it pretty. No greeting, no name, no "Good morning". The date and shop name in the top
bar are enough.

### Layout at 1366×768

**Row 1 — five stat cards**, equal width, 1px border, 8px radius, no shadow.
Label 12px muted · value 24px tabular · delta chip where meaningful.

| Card | Value | Delta |
|---|---|---|
| Today's sales | `₹86,420.00` | vs same day last week |
| Bills | `142` | vs same day last week |
| Average bill | `₹608.59` | — |
| Cash in drawer | `₹41,200.00` | — |
| Credit outstanding | `₹1,240.00` | — |

Cards are not tinted. Deltas use `--k-pos` / `--k-neg` **ink only**, never a background.

**Row 2 — two chart panels**, 280px tall, side by side.

- **30-day sales** — line chart, `--chart-1` (brand green), `--k-border` gridlines, no gradient fill,
  no legend
- **Top 10 movers** — horizontal bars, single hue, `--chart-5`. Categorical data, so one colour

**Row 3 — three attention registers**, equal width, each a 6-row 32px list with a header and a count.

| Register | Rows show | Tint |
|---|---|---|
| Expiring in 30 days | product · batch · days left · value | Expiry banding applies |
| Out of stock — fast movers | product · last sold · 30-day units | `● Nil` red tag, no row tint |
| Credit due this week | party · amount · days overdue | Amber on overdue, red past 30 days |

Every row Enter-navigable into its own screen with that filter applied.

### Keyboard

```
↑↓          move within the focused register
Tab         move between registers
⏎           open the focused row in its screen
Alt+1…9     navigate
Ctrl+K      palette
1–5         jump to the matching stat card's screen
```

Hint bar: `↑↓ Row   Tab Panel   ⏎ Open   Alt+1-9 Go to   Ctrl+K Command`

### Acceptance

- Loads and renders with no spinner or skeleton
- Nothing on the screen is decorative — every element answers a question or navigates
- Three attention registers are the visual centre of gravity, not the charts
- Works at 1366×768 with no vertical scroll

---

## 3. Billing

The screen the shop lives in for eight hours a day. Every other screen is subordinate.

**The hard requirement: a bill is completable from empty to printed without the mouse being touched
once.** Search, quantity, batch, Schedule H1 capture, payment, save, print. Any mouse-only step is a
release blocker, not a bug.

### 3.1 Layout — three bands, two columns

**Top bar** — global shell.

**Body — 70 / 30 split.**

#### Left column (70%) — the line grid

**Bill meta strip** — 36px, `--k-surface-2`, four inline fields, 12px labels above 13px values:
`Bill No. INV-2026-04417` (read only) · `Date 14-09-2026` · `Customer` (searchable, defaults
"Walk-in") · `Doctor` (optional, searchable).

**Search field** — pinned, full width, 40px, 14px, blue focus ring.
Placeholder: `Search brand, molecule, or scan barcode`.
Muted caption right: `3,248 products · 41 fast movers`.

**Line grid** — 32px rows, 14px cells, zebra, 1px borders.

| Col | Width | Align |
|---|---|---|
| # | 32 | left |
| Item | flex | left |
| Batch | 92 | left |
| Exp | 76 | left |
| Qty | 56 | right |
| Free | 48 | right |
| MRP | 88 | right |
| Disc% | 60 | right |
| GST% | 56 | right |
| Amount | 104 | right |
| ⌫ | 32 | — |

Schedule tags `H` and `H1` as 11px outlined chips beside the item name — red outline, red text, never
a filled badge. The tag is information, not an alarm.

Expiry banding applies to the row per the Design System. A line whose batch expires in 47 days carries
the `--k-warn-100` row tint and a `47d` badge in the Exp cell.

Focused row: blue tint at 6% plus a 2px left blue bar.

#### Right column (30%, ~380px) — totals panel

**Customer block** — name, phone, `Regular · 34 bills` muted caption when matched.

**Totals stack** — label left 13px muted, value right 13px tabular:
Items · Sub-total · Discount · CGST · SGST · Round off.
Then a 1px divider, then **GRAND TOTAL**: label 12px muted uppercase, value 28px/700 tabular.

**Payment chips** — one row: `Cash F5` · `UPI F6` · `Card F7` · `Credit F8`.

**Primary action** — full width, 40px, brand green, white text: `Save & Print` with a `⏎` chip.
Below it two ghost buttons: `Hold F9` · `Recall F10`.

**Schedule H1 block** — visible only when an H1 line exists. `--k-surface-2` well with a 1px red-tinted
left border. Heading `Schedule H1 — prescriber required` 13px. Fields: prescriber name (searchable) ·
registration no. · patient name · prescription date. Caption 12px red:
`Required. This entry is written to the Schedule H1 register.`

**Hint bar**:
`⏎ Next   ↑↓ Row   F2 Batch   F4 Discount   F5 Cash   F6 UPI   F9 Hold   F10 Recall   Del Remove   Esc Back   Ctrl+K`

### 3.2 The state machine

```
SEARCH ──⏎──▶ QTY ──⏎──▶ BATCH [FEFO preselected] ──⏎──▶ LINE_COMPLETE ──▶ SEARCH
                                                                              │
                                                           F5/F6/F7/F8 ───────┘
                                                                  ▼
                                                            PAYMENT ──⏎──▶ CONFIRM ──▶ PRINT ──▶ new bill
```

- `Esc` backs out **exactly one** state. Never more, never to the top.
- `F9` hold and `F10` recall available from any state except PAYMENT.
- `F4` discount opens inline on the focused line; permission-gated server-side.
- `Del` removes the focused line from LINE_COMPLETE or SEARCH.
- Barcode: fast keystrokes terminated by Enter, detected by inter-key timing, skips straight from
  SEARCH to QTY with the batch FEFO-preselected.

Mode is **derived** from state, never stored.

### 3.3 Required states

Each is a distinct visual state of the same screen, not a separate page.

**A — Product search open.** Results drop below the field, **six visible**, **44px two-line rows**
(Design System §7, "Search/picker result row"), virtualised beyond six. Every result shows all eleven
mandatory fields without exception — Name, CONTENT (salt), Dose, Dosage Form, Manufacturer, Batch,
Expiry, Current Stock, Rack, MRP, Price (PTR):

```
Line 1 (14px)        Name (600) · CONTENT dose FORM              stock · MRP
Line 2 (12px muted)  Manufacturer · Batch · Expiry · Rack         PTR · expiry badge
```

Batch and Expiry shown are the FEFO batch that Enter would select — a preview, not the picker; `F2`
(global, per the hint bar) opens the batch popover (state B) to override. First row selected. A
second group headed `Same composition` lists alternatives; out-of-stock items show `Nil` in red and
sort last. Caption: `↑↓ select   ⏎ add   Tab batch   Esc close`. **No spinner, no "Searching…", no
shimmer.**

**B — Batch picker.** Popover anchored to the line, 320px, not a centre modal. Rows: Batch · Expiry ·
Qty · MRP, with expiry banding applied per row. FEFO batch preselected and tagged. Caption:
`FEFO batch preselected. ↑↓ change   ⏎ confirm   Esc keep default`.

**C — Quantity rejected.** Invalid quantity — non-numeric, zero, negative, or exceeding on-hand net of
what is already on this bill — is **rejected, not clamped.** The bad value stays visible, the field
shows a red border, and the error states the fact and the number: `Only 6 on hand.` Silent correction
is forbidden.

**D — Payment.** Takes over the right 30% column so the line grid stays visible and verifiable. Not a
centre modal. Heading `Payment` 16px · amount due 28px tabular · tendered field 40px focused ·
change due 20px. `Add split F3` ghost. Primary `Confirm & Print ⏎`.
Hint bar: `⏎ Confirm   F3 Split   Esc Cancel`.

**E — Saved and printing.** 44px strip below the top bar in `--k-brand-bg` with a 1px `--k-brand-line`
border: `Bill INV-2026-04417 saved · ₹588.00 · printing to EPSON TM-T82`, with `Reprint F11` ghost and
`New bill ⏎` primary. The grid behind has already cleared with the search field focused — the next
customer is already waiting. This is the one place brand green appears as confirmation.

**F — Offline.** Sync chip `● Offline` muted grey. 24px strip in `--k-warn-50`:
`Working offline. 3 bills will sync when the connection returns.` 12px, **no action button** — there
is nothing for the user to do and a button would imply otherwise. Billing fully functional, nothing
disabled.

> This is the most important state in the product to get emotionally right. It must read as normal,
> not as breakage. Test it by asking someone who has never seen Kemist what the grey chip means.

**G — Safe mode (plan expired).** Full billing screen visibly intact. 40px strip in `--k-warn-100`:
`Your plan expired on 10-09-2026. Billing is paused. Your data, reports and statutory exports are
fully available.` with a `Renew` brand-green button. Billing inputs disabled and visibly inert — muted,
not red, not struck through. Day book, all registers and **all statutory exports fully enabled and
visibly normal.** No modal, no takeover, no countdown, no dark overlay.

> A takeover here reads as hostage-taking to a shop owner with a queue at the counter. This state
> closes compliance gate G3, which is currently failing, so design-lock it before implementing.

Also specify the **7-days-before** state: identical screen, no strip, one 12px muted line in the top
bar — `Plan renews in 7 days · Renew`. Nothing more.

### 3.4 Acceptance

Beyond the Design System review gate:

1. **The zero-mouse test passes** — empty bill to printed receipt, no mouse events
2. `Esc` from every state backs out exactly one level, verified state by state
3. An invalid quantity is rejected with the value still visible; nothing is clamped
4. The oversell guard nets against quantity already on the bill for that batch
5. Totals arithmetically match the lines, including tax and round-off
6. FEFO batch is preselected and the tag says **FEFO**, never FIFO
7. An H1 line makes the prescriber block appear and blocks save until complete
8. Offline state disables nothing
9. Safe mode leaves every export reachable
10. 5,000-line stock file: search still renders candidates under 100ms

---

## 4. Seed data

Use these in every screen. A chemist reading the prototype must recognise every line. Do not invent
placeholder products.

**Shop** — Devi Medicals, Thodupuzha, Idukki, Kerala 685584 · GSTIN 32AABCD1234E1Z5 ·
DL KL/TDP/20B/1234 and KL/TDP/21B/1235 · Counter 2 · Operator Anju (Biller)

| Product | Mfr | Pack | Batch | Expiry | MRP | Stock | GST | Sch |
|---|---|---|---|---|---|---|---|---|
| Dolo 650 Tablet | Micro Labs | 15 | DL4421 | 08-2027 | 31.50 | 47 | 5% | — |
| Augmentin 625 Duo | GSK | 10 | AG9012 | 03-2027 | 223.42 | 12 | 5% | H |
| Pan-D Capsule | Alkem | 15 | PD7781 | 11-2026 | 212.00 | 8 | 5% | H |
| Shelcal 500 | Torrent | 15 | SC2210 | 01-2028 | 128.00 | 63 | 5% | — |
| Telma 40 | Glenmark | 15 | TM5534 | 06-2027 | 148.00 | 21 | 5% | H |
| Montek LC | Sun Pharma | 10 | ML8823 | 12-2026 | 212.00 | 4 | 5% | H |
| Zerodol SP | Ipca | 10 | ZS1190 | 09-2026 | 114.00 | 0 | 5% | — |
| Glycomet GP1 | USV | 15 | GM4402 | 05-2027 | 132.00 | 30 | 5% | H |
| Azithral 500 | Alembic | 5 | AZ7745 | 02-2027 | 115.00 | 18 | 5% | H |
| Alprax 0.25 | Torrent | 15 | AP3320 | 10-2027 | 42.00 | 9 | 5% | **H1** |
| Cheston Cold | Cipla | 10 | CC6612 | 04-2027 | 68.00 | 25 | 5% | — |
| Volini Gel 30g | Sun Pharma | 1 | VG2204 | 07-2027 | 135.00 | 14 | 5% | — |
| Dettol 100ml | Reckitt | 1 | DT9901 | 12-2027 | 58.00 | 40 | 18% | — |
| Accu-Chek Active | Roche | 50 | AC1123 | 03-2027 | 1,180.00 | 6 | 5% | — |

**Salt search** — "paracetamol" returns Dolo 650, Calpol 650, Crocin Advance (in stock), Pacimol 650
(nil, sorts last).

**Batch depth — Dolo 650, FEFO order:**
`DL4102 · 10-2026 · qty 6` (near expiry, 47d) → `DL4421 · 08-2027 · qty 41` (FEFO default) →
`DL4590 · 02-2028 · qty 120`

**Customers** — Suresh Kumar +91 94470 22841 (regular, 34 bills) · Fathima P A +91 97460 11238
(credit, ₹1,240.00 outstanding) · Walk-in (default)

**Prescribers** — Dr. Rajeev Menon, TCMC 41288 · Dr. Ann Mary Jose, TCMC 38104

**Scale fixture** — one grid seeded with 5,000 rows, deliberately, so virtualisation bugs surface in
development rather than in a shop.

> **GST note.** Rates above are seed values only. Every rate, HSN map and invoice format comes from an
> effective-dated rules engine and is never hardcoded; historical bills always render at their
> historical rate. Show rates as configuration read at runtime, never as constants in a component.

---

## 5. Open items

| # | Item | Blocks |
|---|---|---|
| 1 | G3 safe-mode behaviour is a failing compliance gate | Any short-term plan shipping |
| 2 | Product Plan V7 §2 assumes a PWA shell, but `http://kemist-<shop>.local` is not a secure context — service workers unavailable on non-node terminals | Omit any "Install app" affordance until the V8 amendment lands |
| 3 | F-key map unvalidated against Marg muscle memory | Ask three AKCDA shops which keys they hit without looking. If F5 differs from theirs, switching cost rises sharply |
| 4 | Print path untested — thermal 80mm with DL numbers, GSTIN, batch and expiry per line | Zero-mouse test cannot complete without it |
