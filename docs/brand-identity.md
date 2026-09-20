# Kemist — Brand Identity — V1

> **What changed in v1:** First issue. Establishes the brand as extracted from the shipped marketing site
> and logo asset suite, and resolves the brand-green / state-green relationship for application use.
> **Amendment flagged:** the locked token architecture separates brand green (`#127A4A`) from state green
> (`#178A50`). That separation is preserved. What this document adds is a scoping rule — state green is
> now restricted to transient confirmation and is no longer a persistent row or status colour. Reason:
> the two greens are 1.5% apart in hue and are indistinguishable on a washed-out counter monitor, so
> they cannot both appear as *meanings* in the same grid. See §3.3.

---

## Document authority

This document is the authority on: brand colour values, the logo, typefaces, voice, and product
vocabulary. It does not govern layout, density, component design or code.

**Precedence when documents conflict** — resolve upward, never silently choose:

1. Compliance gates and statutory requirements
2. Engineering Plan (locked architecture decisions)
3. **Brand Identity** (this document)
4. Design System
5. Frontend Engineering Standards
6. Screen Specs

---

## 1. What Kemist is

Kemist is an offline-first billing and inventory ERP for independent retail chemist shops in India,
Kerala first. A Go single binary runs on one PC inside the shop and serves the React UI to browser
terminals over the shop LAN.

The name is the buyer's own trade identity — *chemist* — respelled to be ownable and
trademark-defensible. That naming logic is locked and applies to future products in the line.

**The product is Kemist.** The PharmOS / PharmOS X / PharmaOS naming line is retired and must not appear
in code, comments, UI strings, filenames, documents or assets. Treat any occurrence as a defect.

---

## 2. Positioning in one line

The simplest, fastest, most legible pharmacy software in India — built by someone who has stood behind
the counter.

Everything downstream follows from that. Simplicity here means *fewer decisions per second for the
user*, not fewer pixels on screen. A dense screen that answers a question at a glance is simpler than a
sparse screen that requires three clicks.

---

## 3. Colour

### 3.1 The principle

**Brand green carries identity. Blue, amber and red carry interaction and state. The two never compete
for meaning.**

This is already shipped in the marketing site's token layer and is the governing principle for the
application too. It is the reason Kemist can be green-branded — which is commercially correct for an
Indian pharmacy, where the green cross is the trade signal — without green becoming meaningless.

### 3.2 Brand palette

| Token | Hex | Role |
|---|---|---|
| `--k-brand` | `#127A4A` | **The** Kemist green. Logo, primary action, active navigation, brand chrome |
| `--k-brand-hover` | `#0D6039` | Hover and active state of brand green |
| `--k-brand-bg` | `#EFF7F2` | Brand tint — confirmation strips, brand badges |
| `--k-brand-line` | `#CBE6D8` | Border pair for brand-tinted surfaces |
| `--k-ink` | `#1C1C1A` | Primary text. The logo's alternate rendering |
| `--k-surface` | `#FFFFFF` | Reversed logo rendering; card surfaces |

`#127A4A` is the brand colour, not `#2456E6`. Evidence: every logo and icon SVG renders in green or ink
and none uses blue; the PWA manifest's `theme_color` is `#127A4A`; the marketing site's own token
comment states it explicitly.

Any earlier document calling blue "the only brand colour" is superseded by this one.

### 3.3 The two greens — scope rule

Both tokens exist. They are not interchangeable.

| | `--k-brand` `#127A4A` | `--k-pos` `#178A50` |
|---|---|---|
| Means | Kemist is here / this is the action | This just succeeded |
| Persistence | Permanent chrome | Transient — seconds, then gone |
| Examples | Logo, primary button, active nav item, focus-complete state | "Bill saved" strip, "Backup complete" toast, sync-just-finished flash |
| Never used for | Status columns, row tints, stock state | Anything that persists on screen |

**"In stock" and "synced" render in neutral ink with no colour at all.** Normal state needs no colour;
only exceptions do. A grid where every healthy row is green is a grid where nothing stands out — and
the whole job of an operational grid is to make exceptions findable in one glance.

### 3.4 Interaction and state palette

Defined in full in the Design System. Summarised here so the brand boundary is unambiguous:

- **Blue `#2456E6`** — where you are. Focus ring, selected row, picking state, links.
- **Amber `#B96A00`** — caution. Near expiry, pending sync, low stock.
- **Red `#C6222F`** — stop. Expired, error, nil stock, void.

A green-filled primary button carrying a blue focus ring is correct and intended: green says *this is
the action*, blue says *your keyboard is here*.

---

## 4. Logo

### 4.1 The system

A **mark** and a **wordmark**, available separately and as lockups.

**The mark** is two shapes on a 100×100 canvas: a vertical rounded bar (a capsule silhouette) and, to
its right, a left-opening chevron stroke with rounded caps tracing a wide "<". Nothing else. No third
element, no enclosure, no wordmark baked in.

**The wordmark** renders "Kemist" as vector path outlines, not live text — so it reproduces identically
regardless of whether Inter is available at display time.

### 4.2 Variants

| Variant | Use |
|---|---|
| Green `#127A4A` | Primary. Light backgrounds |
| Ink `#1C1C1A` | Monochrome contexts, documents, printed material |
| Reversed white | Dark or photographic backgrounds |

Each is a separate pre-baked asset. Do not recolour at use time — it produces inconsistent results
across renderers.

### 4.3 Small sizes

A dedicated favicon asset exists: a flat green rounded square with the mark in solid white at roughly
half the canvas. It holds at 16px because it was built for 16px — two shapes, no fine detail, full-tone
contrast, no gradients. **Do not shrink the full mark to favicon size.** Use the favicon asset.

### 4.4 In-application use

The wordmark appears once, in the top bar, at 14px. Nowhere else. No watermarks, no logo in empty
states, no logo on printed bills beyond the shop's own header block. The application is an instrument
the shop owns; it should not advertise at its own user 400 times a day.

---

## 5. Typography

**Inter, self-hosted.** Weights 400, 500, 600, 700 as static `.woff2` files. No Google Fonts CDN — the
shop PC may have no internet, and a font that fails to load is a broken screen.

Malayalam fallback: `"Noto Sans Malayalam"`. Full stack:

```
Inter, "Noto Sans Malayalam", system-ui, sans-serif
```

One family throughout. No display face, no monospace. Tabular figures come from
`font-variant-numeric: tabular-nums` on Inter itself, not from a second typeface.

The marketing site runs 16px body because it is read at arm's length. The application runs 14px because
it is read at counter distance with more information per screen. Both are correct for their context;
neither should be copied to the other.

---

## 6. Voice

### 6.1 Register

Short, declarative, concrete. Numbers instead of adjectives. No exclamation marks. No
"revolutionise", "empower", "seamless", "delight". No encouraging microcopy.

The shipped marketing copy sets the tone: *"Three letters finds the pack, the batch and the rack."*
*"The backup runs while you sleep."* Facts, stated plainly, that happen to be persuasive because they
are true.

### 6.2 In-application copy is plainer still

Marketing copy persuades a stranger. Application copy informs someone mid-transaction with a customer
waiting. The register tightens accordingly:

- **Errors state a fact and a number.** "Only 6 on hand." "Expired batch — cannot be billed."
  "Nothing by that name." No apology, no hedging, no "Oops".
- **Empty states give one line and the key that fixes it.** "No items. Press `/` to search."
- **No greeting, ever.** No "Good morning", no user's name on the dashboard. The date and the shop name
  are enough.
- **No claims inside the product.** "Matches land before you finish the word" belongs on the homepage,
  not above a search box.

### 6.3 Vocabulary — use these words

| Use | Not |
|---|---|
| settle (a bill) | checkout, pay out |
| shop | store, outlet, branch |
| batch and expiry | lot, batch no. |
| **FEFO** / first-expiry-first-out | **FIFO** |
| rack location | shelf, bin |
| restore point | snapshot, save |
| drug register | compliance log |
| MRP, PTR | list price, cost |
| pack | unit, SKU (when addressing the user) |
| held bill | parked sale, suspended |

**FIFO vs FEFO is not a style preference.** They are different concepts — receipt order versus expiry
order — and Kemist does FEFO. The live marketing site currently shows a `FIFO` badge on the billing
demo while its own structured data correctly says first-expiry-first-out. That is a defect on a public
page a distributor may read; log it.

### 6.4 Language

English and Malayalam in the application. Malayalam strings run 20–40% longer than English.

Public-facing brand materials stay in English — no regional-language branding. Malayalam is a UI
language option for the people operating the software, not a positioning choice.

---

## 7. Known brand defects to fix

| # | Defect | Where | Severity |
|---|---|---|---|
| 1 | `FIFO` badge labels FEFO behaviour | Marketing site billing demo | Public-facing, factually wrong |
| 2 | `theme_color` is `#127A4A` in the manifest but `#FAFAF9` in Next's viewport config | Marketing site | PWA chrome inconsistent |
| 3 | Retired PharmOS naming persists in skill filenames and Engineering Plan V1 | Internal docs | Leaks into generated code |

---

## 8. What must not be carried from the marketing site into the application

The marketing site is built to persuade a stranger in eight seconds. The application is built to be
operated for eight hours. Brand carries across; register does not.

**Carries:** colour values, Inter, the logo, vocabulary, the declarative voice.

**Does not carry:** hero sections, generous whitespace, animation and attract loops, onboarding
checklists, "Try this" chips, pulsing invitations, narrative labels, signup forms, soft numeric claims.

And specifically: the marketing billing demo is **not** a behavioural reference. It omits the oversell
guard, clamps quantities instead of rejecting them, has no tax line, and implements two of six
interaction modes. `docs/BEHAVIOUR-SPEC.md` is the authority on billing behaviour. The demo is a
picture of the product, not a specification of it.
