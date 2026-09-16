# Pharmacy Billing Screen — Behaviour Specification

This document specifies the *behaviour* of a single-screen pharmacy point-of-sale
billing prototype, for the purpose of rebuilding it from scratch — possibly in a
different language, framework, or platform. The existing implementation is being
discarded; nothing here should be read as a description of how the old code
happened to be organised. Every rule below is a requirement the rewrite must
reproduce, not an implementation detail it must copy.

The screen lets a cashier: search a stock catalogue, pick a batch of a product to
sell from, enter a quantity, add it to a running bill, edit or remove bill lines,
and settle the bill by cash or UPI. It is keyboard-first (a real point-of-sale
keyboard with function keys) with mouse/touch as a secondary input method for the
same actions.

---

## 1. Quantity & Stock Math

### 1.1 The core invariant

Every batch of stock has an on-hand quantity that is always recorded in the
product's **native pack unit** — for a product sold as strips of tablets, that
unit is *strips*, never tablets. For every other kind of product (a bottle of
syrup, a vial of injection, a tube of gel, an inhaler, a sachet, or a tablet
product that is deliberately sold loose out of a bottle rather than by the
strip), the native pack unit is whatever that product is naturally counted in,
and there is no secondary unit at all.

Tablet-level counts, for strip products, are **always calculated on demand from
the strip count** — they are never themselves the stored fact. There is exactly
one source of truth for how much of a batch exists: the native-unit count.

### 1.2 Splitting a tablet quantity into strips + loose tablets

For a strip product with strip size *S*, a tablet quantity *Q* splits into:

- **Whole strips** = *Q* divided by *S*, rounded down.
- **Loose tablets** = the remainder of that division.

Worked examples (strip size 15): 16 tablets → 1 strip + 1 loose tablet. 30
tablets → 2 strips + 0 loose. 44 tablets → 2 strips + 14 loose. 14 tablets → 0
strips + 14 loose.

Worked example (strip size 20): 47 tablets → 2 strips + 7 loose.

### 1.3 Converting native units to sellable units

The bill always counts a strip product's lines in **tablets** (the sellable
unit), never in strips, even though the batch's on-hand figure is recorded in
strips. Two conversions follow from the strip size:

- **Tablets on hand** = batches's on-hand strip count × strip size.
  Example: 8 strips on hand at strip size 15 → 120 tablets on hand.
- **Price per tablet** = the batch's per-strip rate (or MRP) ÷ strip size.
  Example: a strip rated at ₹31.50 with strip size 15 → ₹2.10 per tablet.

For a non-strip product, both of these are pass-throughs: "on hand" is just the
native-unit count, and "price per unit" is just the native-unit rate/MRP,
unchanged.

### 1.4 Line total

A bill line's amount is always: **quantity (in sellable units) × price per
sellable unit**. For a strip product this is tablet quantity × price-per-tablet;
for everything else it is native-unit quantity × native-unit price.

Example: 22 tablets of a product priced at ₹2.10/tablet → ₹46.20.

### 1.5 Clamping a requested quantity

Whenever a quantity needs to be forced into a legal range without asking the
user (for example, a stepper button nudging a value up or down), the rule is:
clamp the requested number to be **at least 1 and at most the tablets/units
currently on hand**. If on-hand is zero or less, the clamped result is 0 (there
is nothing legal to request).

Example: on-hand = 120 tablets. Requesting −5 clamps to 1. Requesting 500
clamps to 120. Requesting 47 stays 47.

### 1.6 The oversell guard

When a cashier is adding *more* of a batch that is already partly on the bill
(rather than editing that existing line directly), the quantity already
committed to the bill for that exact batch must be treated as **already
spoken for**. The amount actually available for a new "add" is:

    available = tablets/units on hand − quantity already on the bill for this batch

This guard exists so that two separate "add to bill" actions for the same batch
can never together exceed what's actually on the shelf.

Worked example: a batch has 42 tablets on hand. 10 of them are already on the
bill as an existing line. The cashier opens the same batch again and types 35
more. Available is 42 − 10 = 32, so 35 is rejected (only 32 more are in stock).
Typing 32 or fewer succeeds; on success, the new quantity is **added to** the
existing line's quantity rather than creating a duplicate line for the same
batch.

When a cashier is instead editing an existing line's quantity **in place**
(changing 10 to 15, say, on the same line), the oversell guard does not
subtract anything — the full on-hand figure is what's available, because the
line being edited is the only claim on that stock and its old value is being
replaced, not added to.

### 1.7 Quantity validation (the rejection ladder)

Before any typed quantity is allowed to be committed — whether adding a new
line or saving an edit to an existing one — it is validated in this exact
order, and the **first** failing rule wins:

1. Input is empty (after trimming whitespace) → **"Enter a quantity."**
2. Input is not a whole, unsigned number (i.e. not just digits) → **"Enter a
   whole number."**
3. The parsed number is zero or negative → **"Quantity must be at least 1."**
4. Nothing is available at all (on-hand minus whatever's already reserved on
   the bill, per §1.6, is zero or less) → **"Out of stock."**
5. The parsed number exceeds what's available → **"Only N more in stock."**
   where N is the exact remaining number computed in §1.6.
6. Otherwise: the value is valid — no message, and the value is safe to commit.

**Critically, a failing value is *rejected*, never silently clamped.**
Confirming (pressing the equivalent of "Enter" / "Add" / "Save") while the
typed value fails any of these checks is a no-op: nothing changes, the overlay
or edit stays open, and the error message is shown. Clamping (§1.5) is a
separate, deliberate action reserved for the +/− nudge controls — typing a bad
value directly is never auto-corrected on the user's behalf.

---

## 2. Expiry Rules

Every batch carries an expiry recorded to a specific month and year. From that,
the system derives four things for display: a short label, a "remaining life"
phrase, a status severity, and whether the batch is dead stock.

### 2.1 Remaining months

Remaining months = (expiry year × 12 + expiry month) − (current year × 12 +
current month). This is a simple month-granularity difference; days within the
month are not considered — a batch expiring anywhere in the current month is
treated identically regardless of which day "today" is.

### 2.2 The label

The label is always "MM/YY" — two-digit month, slash, two-digit year — built
directly from the batch's expiry, independent of how much time is left.
Example: an expiry of May 2026 labels as "05/26".

### 2.3 The remaining-life phrase and status, by bucket

Evaluate remaining months (§2.1) against these buckets, in order:

| Remaining months | Life phrase | Status | Dead? |
|---|---|---|---|
| Negative (already passed) | "(expired)" | bad | **yes** |
| Exactly 0 | "(this month)" | bad | no |
| 1 to 11 | "(N mo)" | soon (≤6) / normal (7–11) | no |
| 12 or more | "(Y y)" or "(Y y M m)" | soon / normal (see below) | no |

Worked examples (assume "today" is any date in a given month, since only
month-granularity matters):

- Expiry is 1 month in the past → **"(expired)"**, bad, dead.
- Expiry is this same month → **"(this month)"**, bad, not dead.
- 3 months remain → **"(3 mo)"**.
- 6 months remain → **"(6 mo)"**, and this is the last bucket still flagged
  "soon" (see §2.4).
- 7 months remain → **"(7 mo)"**, no special status.
- 14 months remain → floor(14/12) = 1 year, remainder 2 months → **"(1 y 2
  m)"**.
- 24 months remain exactly → 2 years, remainder 0 → **"(2 y)"** — the "M m"
  part is **omitted entirely** when the remainder is zero, not shown as "0 m".
- 25 months remain → **"(2 y 1 m)"**.

### 2.4 Status severity

- **Bad**: expired, or expiring this exact month.
- **Soon**: 1 to 6 months of remaining life (inclusive).
- **Normal** (no special status): 7 or more months of remaining life.

### 2.5 Dead stock

A batch is "dead" if and only if its remaining months are negative (it has
already expired). Batches that expire "this month" are flagged bad but are
**not** dead — they are still sellable today. Dead batches should be excluded
from "first sellable batch" logic (e.g. picking which batch to default-suggest,
or which to sum into an in-stock count for a search result) but should still be
visible/selectable in a full batch list so a cashier can still see and
deliberately choose to sell down truly expired stock if the business rules of a
concrete deployment require that.

---

## 3. Billing State Machine

### 3.1 Overview

The screen is driven by one small piece of state: what the cashier is currently
searching for, where keyboard focus currently sits, what (if anything) is
overlaid on top of the main view, and the list of lines on the current bill.
Everything else the screen needs — including which of six named **modes** it is
currently in — is **derived** from that state on every render, never stored as
its own separate flag.

### 3.2 The six modes

| Mode | Meaning |
|---|---|
| **search-idle** | The search box has focus and is empty. |
| **search-typing** | The search box has a non-empty query; results are showing (whether the search box or a result row currently has focus). |
| **batch-picking** | A product's batch list is open, and the cashier is still choosing which batch to sell from. |
| **batch-qty** | A batch has been chosen; the cashier is entering how many units to add. |
| **bill-navigating** | Focus is on a line in the bill, moving between lines. |
| **line-editing** | An existing bill line's quantity is being edited in place. |

### 3.3 How the mode is derived, and why

The mode is computed, top to bottom, by asking:

1. Is there a batch-picking overlay open? If so: is it on the "choose a batch"
   step, or the "enter a quantity" step? → **batch-picking** or **batch-qty**
   respectively.
2. Otherwise, is a bill line currently being edited? → **line-editing**.
3. Otherwise, does keyboard focus currently sit on a bill line? →
   **bill-navigating**.
4. Otherwise, is the search query non-empty? → **search-typing**, else
   **search-idle**.

**Why derive instead of store:** if "mode" were its own independent field, it
would be possible for the rest of the state to drift out of sync with it — for
example, focus could claim to be on a bill line while mode still said
"line-editing" for a *different* line, or an overlay could be closed while mode
still reported "batch-qty". By computing mode fresh from the same handful of
facts (what overlay exists and its step, where focus points, whether there's a
query) every time, those contradictory combinations are structurally
impossible to represent — there's no separate "mode" value that could ever
disagree with the facts it's supposed to summarize. This also means every
screen that needs to know the mode (status hints, which panel to show, which
keys are active) reads the same single, always-consistent computation instead
of trusting a value that has to be remembered to be kept in sync by hand.

### 3.4 Focus and the "ring"

Keyboard focus points at exactly one of three kinds of place at any time: the
search box itself, a specific row in the current search-results list, or a
specific line in the bill. Whichever it is, the on-screen presentation (the
"focused" highlight) moves to match.

**The ring, as the cashier experiences it:** moving "down" always advances to
the next logical row on screen — from the search box, into the top search
result (if any are showing); from the last search result, into the first bill
line (if any exist); from the last bill line, back around to the search box.
Moving "up" does the same walk in reverse. There is no dead end in either
direction — the cashier can hold the down-arrow and cycle through everything
on screen indefinitely, search box → results → bill → search box → results →
…, and the same going up. If there are no search results showing and no bill
lines yet, the ring is just the search box, and up/down do nothing observable.

This is the same underlying idea whether there happen to be 0, 3, or 8 result
rows, or 0 or 40 bill lines on a given screen — the ring always has exactly
three segments in the same fixed order (search, then results, then bill), and
its total length simply grows or shrinks with however many result rows and
bill lines currently exist.

**Bill-only jumps:** while focus is on a bill line specifically, four
additional jumps are available that don't exist anywhere else in the ring:
jump to the first bill line, jump to the last bill line, and jump five lines
up or five lines down (clamped to the first/last line rather than wrapping).
These do nothing while focus is anywhere other than a bill line.

### 3.5 Opening and stepping through batch-picking

Selecting a search result opens that product's batch list as an overlay, on
the "choose a batch" step, with the first batch highlighted and remembering
which search-result row to return focus to if the overlay is dismissed.

From the "choose a batch" step: moving up/down re-highlights the previous/next
batch in the list, wrapping around at both ends (last batch's "down" goes back
to the first, and vice versa). Confirming the highlighted batch — or directly
picking a specific batch by pointing at it — locks that batch in and advances
to the "enter a quantity" step, resetting the typed quantity to "1".

From the "enter a quantity" step: the typed quantity is free text (validated
per §1.7, not clamped as it's typed) and can also be nudged up or down by
whole units — or, if the product is a strip product, by a whole strip's worth
at once (see §4.3). Confirming a valid quantity (§1.7) adds it to the bill
(§3.6) and closes the overlay entirely, returning focus to the search box and
clearing the search query. Confirming an invalid quantity does nothing (stays
on this step, shows the error).

### 3.6 Adding a line / the "most recent on top" rule

When a valid quantity is confirmed for a batch:

- If that exact batch is **not already** on the bill, a new line is created
  for it.
- If that exact batch is **already** on the bill, the newly confirmed quantity
  is **added to** that existing line's quantity (subject to the oversell guard
  in §1.6) rather than creating a second line for the same batch.

Either way, the affected line is then moved to (or created at) the **very top**
of the bill list, ahead of every other line. This is deliberate: whatever the
cashier just scanned or topped up should be immediately visible at the top of
the list without having to scroll or hunt for it, even on a long bill.

### 3.7 Editing an existing bill line

Opening a bill line for editing starts an in-place edit: a text field seeded
with the line's current quantity, plus the same nudge/validate rules as
batch-qty (§1.7, §4.3). Confirming a valid new quantity replaces the line's
quantity and closes the edit. Confirming an invalid value is a no-op (edit
stays open, error shown). Cancelling the edit discards the typed value and
restores the line to its previous quantity, without needing to know or restore
the old text — the line's stored quantity was never touched until a valid
confirm.

### 3.8 Removing a line

Removing a bill line removes exactly that line and recomputes focus:

- If that was the last line on the bill, focus returns to the search box.
- If focus was on the removed line itself, focus lands on whichever line now
  occupies that same position (or the new last line, if the removed line was
  last).
- If focus was on some other line below the removed one, focus shifts up by
  one position to keep pointing at the same logical line.
- If an unrelated line was mid-edit at the time, that edit is left completely
  alone — only an in-progress edit on the line actually being removed is
  cancelled.

### 3.9 Enter and Escape, mode by mode

Both Enter and Escape are **global, app-level** keys — they're intercepted
everywhere, including while a text field has keyboard focus (they never fall
through to native text-editing behaviour the way ordinary typing does).

| Mode | Enter does | Escape does |
|---|---|---|
| search-idle | Nothing observable (no result or line is targeted). | Nothing (no query to clear). |
| search-typing, focus on the search box | Nothing observable (no result row is targeted yet). | Clears the typed query. |
| search-typing, focus on a result row | Opens that product's batch list (→ batch-picking). | Clears the typed query and returns focus to the search box. |
| batch-picking (choosing a batch) | Confirms the highlighted batch, advances to batch-qty. | Closes the batch overlay entirely and returns focus to the search-result row it was opened from. |
| batch-qty (entering a quantity) | If the typed quantity is valid: adds/updates the bill line and returns to search-idle. If invalid: no-op, shows the error. | Steps back to the "choose a batch" step (does **not** close the overlay). |
| bill-navigating | Opens the focused line for editing (→ line-editing). | Nothing (there is no query and no overlay to dismiss from here). |
| line-editing | If the typed quantity is valid: saves it and closes the edit. If invalid: no-op, shows the error. | Cancels the edit and discards the typed value, without saving. |

### 3.10 Global commands (available in every mode)

Four commands are always available regardless of mode, and always take effect
immediately with no confirmation step:

- **Settle by cash.** If a bill line is currently mid-edit, that edit is first
  committed (using its currently-typed, already-valid quantity) before
  settling. If the bill has no lines, nothing happens. Otherwise: the grand
  total (§ below) is computed and flashed on screen as a payment confirmation,
  the bill is cleared, the invoice number advances by one, and focus returns
  to an empty search box.
- **Settle by UPI.** Identical to cash settlement, differing only in which
  payment method is recorded/flashed.
- **Clear the current bill.** Empties the bill line list and returns focus to
  the search box. If a line was mid-edit, that edit is discarded (not
  committed) as part of the clear.
- **Start a new bill.** Resets the entire screen to its startup state (empty
  query, empty bill, focus on the search box, no overlay) and advances the
  invoice number by one — used to abandon the current bill without settling
  it, distinct from clearing lines but keeping the same in-progress invoice.

### 3.11 Totals

Subtotal is the sum of every bill line's amount (§1.4). Tax is a fixed
percentage of the subtotal (12% in this prototype, but should be treated as a
configurable rate rather than a hard-coded number in the rewrite). Grand total
is subtotal plus tax. These are recomputed continuously as lines are added,
edited, or removed — they are never stored, only derived, matching the
"derive, don't store" principle used for mode (§3.3).

---

## 4. Keyboard Map

### 4.1 Full table

| Key | Scope (active in) | Action | On-screen hint text |
|---|---|---|---|
| Any printable character | search box has focus | Types into the search query. | *(placeholder text: "Brand, salt, dose, pack, rack, maker or batch…")* |
| **/** | Any mode where the search box does **not** currently hold focus (a result row, a bill line, or the "choose a batch" step of batch-picking) | Jumps focus straight to the search box. | Idle mode only: "/ jump to search". Shown as a persistent small badge next to the search box at all times, independent of mode. |
| **↑ / ↓** (plain) | search-idle / search-typing (focus on search box or a result row); bill-navigating | Moves focus one step around the ring (§3.4) — wrapping. | search-idle: not shown. search-typing: "↑/↓ move". bill-navigating: "↑/↓ move". |
| **↑ / ↓** (plain) | batch-picking (choosing a batch) | Re-highlights the previous/next batch, wrapping. | "↑/↓ choose batch". |
| **↑ / ↓** (plain) | batch-qty / line-editing | Nudges the typed quantity down/up by 1, clamped (§1.5). | "↑/↓ ± 1". |
| **Shift + ↑ / ↓** | batch-qty / line-editing, **only when the product has a strip size** | Nudges the typed quantity down/up by one full strip's worth, clamped (§1.5). On a non-strip product this key combination has **no special effect** — it behaves exactly like plain ↑/↓ (±1), because there is no strip size to step by. | "Shift ± 1 strip" (shown unconditionally — see §4.3 for the caveat). |
| **Enter** | Every mode | See the full per-mode table in §3.9. | Varies per mode — see §3.9 and §4.3. |
| **Escape** | Every mode | See the full per-mode table in §3.9. | Varies per mode — see §3.9 and §4.3. |
| **Delete** or **Backspace** | bill-navigating only | Removes the focused bill line (§3.8). | "Del remove line" (Backspace also works but isn't named — see §4.3). |
| **Home** | bill-navigating only | Jumps focus to the first bill line. | "Home/End/PgUp/PgDn jump". |
| **End** | bill-navigating only | Jumps focus to the last bill line. | (same hint as above) |
| **Page Up** | bill-navigating only | Jumps focus up 5 bill lines, clamped to the first line. | (same hint as above) |
| **Page Down** | bill-navigating only | Jumps focus down 5 bill lines, clamped to the last line. | (same hint as above) |
| **F5** (or Ctrl+Alt+C) | Every mode, always | Settle by cash (§3.10). | "F5 cash" / button labelled "Cash". |
| **F6** (or Ctrl+Alt+U) | Every mode, always | Settle by UPI (§3.10). | "F6 UPI" / button labelled "UPI". |
| **F9** (or Ctrl+Alt+X) | Every mode, always | Clear the current bill (§3.10). | "F9 clear" / button labelled "Clear". |
| **F4** (or Ctrl+Alt+N) | Every mode, always | Start a new bill (§3.10). | "F4 new bill" / button labelled "New bill". |

The Ctrl+Alt+letter fallbacks for the four global commands exist for
keyboards/operating systems where the top-row F-keys are intercepted by the OS
(media controls, brightness, etc.) before they ever reach the page — the
letter chosen is mnemonic (C for Cash, U for UPI, X for cleared/"X", N for
New).

Every key above that is *not* one of the four global commands or Escape/Enter
is suppressed while a real text-entry field (the search box, or the inline
quantity field) has focus, **except** ↑/↓, which are always intercepted for
ring/cycle/nudge purposes even while a text field has focus (since arrow keys
don't move a text caret usefully in a single-line field anyway, it's safe to
take them over everywhere).

### 4.2 On-screen legend, by mode (for reference)

A persistent status strip shows a short legend matching the current mode:

- **search-idle:** "Type to search · / jump to search · F4 new bill · F5 cash
  · F6 UPI · F9 clear"
- **search-typing:** "↑/↓ move · Enter open batches · Esc clear · F4 new bill
  · F5 cash · F6 UPI · F9 clear"
- **batch-picking:** "↑/↓ choose batch · Enter continue · Esc back"
- **batch-qty:** "Type a quantity · ↑/↓ ± 1 · Shift ± 1 strip · Enter add ·
  Esc change batch"
- **bill-navigating:** "↑/↓ move · Enter edit qty · Del remove line ·
  Home/End/PgUp/PgDn jump · F5 cash · F6 UPI · F9 clear"
- **line-editing:** "↑/↓ ± 1 · Shift ± 1 strip · Enter commit · Esc cancel"

Separately, the empty-bill state shows its own standalone hint: **"Bill is
empty. Search a product and press Enter to add a line."**

And the batch-picking overlay itself shows step-specific hints: on the
"choose a batch" step, **"Enter to pick this batch."**; on the "enter a
quantity" step, **"Enter to add · Esc to change batch."** (or, while the typed
quantity is invalid, "Fix the quantity to add · Esc to change batch.").

### 4.3 Reconciling the four places this map disagrees with itself

The keyboard behaviour is described in four separate places on screen (the
persistent mode legend, the batch-picker's own inline hints, the empty-bill
hint, and the permanently-visible "/" badge next to the search box), and they
don't all say quite the same thing. For the rewrite, treat the **actual
key-handling rules in §3 and §4.1 as authoritative** in every case below — the
on-screen copy should be corrected to match them, not the other way around.

1. **"Press Enter to add a line" vs. the real three-step chain.** The
   empty-bill hint implies one keystroke adds a line to the bill. In reality
   it takes **three separate Enters across three different modes**: Enter on
   a highlighted search result *opens its batch list* (does not add
   anything); Enter again on the highlighted batch *advances to the quantity
   step* (still does not add anything); a third Enter, only once the typed
   quantity is valid, *actually adds the line*. Treat the empty-bill copy as
   a colloquial, aggregate description of the whole flow ("search, then
   press Enter a few times") — not a literal single keystroke — and prefer
   the mode-by-mode legend's more accurate per-step wording ("Enter open
   batches", "Enter continue", "Enter add") when in doubt.

2. **"Shift ± 1 strip" stated unconditionally vs. it only applying to strip
   products.** The batch-qty and line-editing legend entries state "Shift ±
   1 strip" as if it always does something extra. The actual rule (§4.1) is
   conditional: Shift+Arrow only steps by a full strip when the product in
   question *has* a strip size. For a syrup, injection, gel, inhaler,
   sachet, or a tablet product intentionally sold loose, Shift+Arrow is
   indistinguishable from plain Arrow (±1 unit) because there is no strip
   concept to step by. The rewrite's on-screen copy should either omit the
   Shift hint for non-strip products or phrase it conditionally (e.g. "Shift
   ± 1 strip, strip items only").

3. **"Del remove line" vs. Delete-or-Backspace both working.** The legend
   names only the Delete key. The actual rule accepts **either Delete or
   Backspace** interchangeably to remove the focused bill line. The rewrite
   should either name both keys in the hint, or pick one key deliberately and
   drop support for the other — but the hint and the behaviour must agree
   with each other, which they currently don't.

4. **The "/" badge is always visible, but the shortcut only sometimes works.**
   A small "/" badge sits next to the search box permanently, on every mode's
   screen, and the mode legend only explicitly calls the shortcut out in
   search-idle. Neither of those matches the actual rule: "/" performs the
   jump-to-search action **only when the search box does not currently hold
   keyboard focus** — i.e., only while focus is on a result row, on a bill
   line, or on the "choose a batch" step of batch-picking (none of which,
   confusingly, is the one mode — search-idle — where the legend mentions
   it). Whenever the search box *does* already have focus (which is true for
   effectively all of search-idle, and for search-typing while the cashier
   hasn't yet arrowed down into a result), pressing "/" does nothing special
   — it is simply typed into the query like any other character. The
   rewrite should show the "/" affordance only in the modes where it
   actually performs the jump, and drop it (or grey it out) everywhere the
   search box already has focus.

---

## 5. Search Ranking

### 5.1 Tokenizing the query

The typed query is trimmed of surrounding whitespace and lowercased. If the
result is empty, there are no results at all (an empty query returns nothing,
not "everything"). Otherwise the query is split on any run of whitespace into
one or more **tokens**.

### 5.2 The per-product search text ("haystack")

For each product in the catalogue, a single combined, lowercased block of text
is built by joining together every one of these fields, space-separated:

- Display name
- Salt / generic composition
- Dose / strength
- Dosage form
- Manufacturer
- Units-per-pack description
- Pack type
- Box description
- Shelf/rack location
- **Every batch number belonging to that product**, all joined together

This means a query can match a product by its brand name, its generic salt
name, its dose, its manufacturer, its shelf location, or the exact batch
number printed on a strip — all through the same search box, with no separate
"search mode" needed to pick which field to search.

### 5.3 Scoring a single token against a product

For a given token and a given product's haystack:

- If the haystack **starts with** the token → score **3**.
- Else if the haystack merely **contains** the token somewhere → score **1**.
- Else (no match at all) → score **0**, and this is treated as a **hard
  exclusion**: if any one token in a multi-token query fails to match a
  product at all, that product is dropped from the results entirely,
  regardless of how well the other tokens matched. Matching is an **AND
  across all tokens** — a product must match every token in the query to
  appear in results at all, not merely some of them.

### 5.4 Total score and ordering

A product's total score is simply the sum of its per-token scores (§5.3)
across every token in the query. Products are then sorted:

1. **Highest total score first.**
2. **Ties broken alphabetically by display name.**

Only the top results are kept — the list is capped at a fixed maximum of
**8** products; anything beyond the 8th-ranked result is not shown at all
(the cashier is expected to refine the query rather than scroll a long list).

### 5.5 Worked example

Suppose the query is two tokens: `"pan"` and `"40"`. Consider two products:

- **Product A**'s combined haystack starts with "pan..." (a name match at the
  very front) and also contains "40" somewhere in its dose field, but not at
  the very start of the whole haystack. Token "pan" scores 3 (starts-with),
  token "40" scores 1 (contains-only). Total = **4**.
- **Product B**'s haystack contains both "pan" and "40" only in the middle of
  other words (e.g. buried in a manufacturer name and a rack code), never at
  the very start. Both tokens score 1 each. Total = **2**.

Product A outranks Product B, because a token matching right at the start of
the combined text is weighted three times as strongly as a token that merely
appears somewhere inside it. Both still appear in the results (neither token
scored 0 for either product), just in score order.

---

## 6. Product & Batch Data Model

This is a schema for the underlying catalogue data, independent of how it's
stored (static file, database table, API response, etc. are all equally valid
in a rewrite).

### 6.1 Product

| Field | Type | Notes |
|---|---|---|
| Identifier | short unique string | Stable key used to look the product up; not shown to the cashier. |
| Display name | string | Brand name shown throughout the UI, e.g. as it would appear on packaging. |
| Salt / composition | string | Generic ingredient name(s); may describe a combination product. |
| Dose / strength | string | Free-text strength description (units vary by dosage form — mg, mg/5ml, %, mcg, IU, etc.). |
| Dosage form | enumeration | One of: tablet, capsule, syrup, injection, gel, inhaler, solution, sachet. |
| Manufacturer | string | The maker/brand-owner name. |
| Units-per-pack | string | Free-text description of what one native pack unit physically is, e.g. "15 tab" or "60 ml". |
| Pack type | enumeration | One of: strip, bottle, vial, tube, inhaler, sachet. Determines the native pack unit. |
| Box description | string | Free-text description of the next packaging level up (e.g. "10 strips / box", "carton"). |
| Shelf / rack location | string | Free-text shelf code for physically locating stock. |
| Strip size | integer, **optional** | The number of tablets/capsules in one strip. **Present if and only if pack type is "strip".** In this prototype, always one of two canonical sizes, but the rewrite should treat it as any positive integer. |
| Batches | ordered list of Batch | See §6.2. Conventionally kept sorted oldest-expiry-first (§6.3). |

### 6.2 Batch (nested under a Product)

| Field | Type | Notes |
|---|---|---|
| Batch number | string | Printed lot identifier, unique within its product. |
| Expiry | year + month | Month-granularity only (no day). See §2 for how this is interpreted/displayed. |
| Quantity on hand | integer | **Always in the product's native pack unit** — strips-on-hand for a strip product, never tablets. Tablet-level figures are derived per §1.3, never stored. |
| Rate | currency amount | Selling price **per native pack unit** (e.g. price per strip, not per tablet, for a strip product). Per-sellable-unit price is derived per §1.3. |
| MRP | currency amount | Printed maximum retail price, per native pack unit, same convention as Rate. Used only for display (e.g. showing a discount percentage against Rate) — it plays no role in the billing math itself. |

### 6.3 Invariants

- **Strip size presence** is exactly determined by pack type: a product has a
  strip size if and only if its pack type is "strip". No product with a
  non-strip pack type carries a strip size, and no strip-type product lacks
  one.
- **FEFO ordering.** Within a product, batches are conventionally kept sorted
  by expiry, soonest-to-expire first ("first-expiry-first-out") — mirroring
  the real-world rule that the stock closest to expiring should be the stock
  a pharmacy sells down first. Any "which batch should be suggested/sold by
  default" logic should read the first non-dead batch in this ordering.
- **Native-unit-only storage.** Quantity, rate, and MRP are always expressed
  in the product's native pack unit at the data layer. Every tablet-level or
  other sellable-unit figure — on-hand tablet counts, per-tablet pricing,
  strip/loose breakdowns — is a derived value computed by the math layer
  (§1), never a second copy of the same fact stored redundantly on the
  batch.
