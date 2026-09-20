/**
 * Shop stock — the only source of data today (see CLAUDE.md "The seam").
 * Nothing outside src/api/client.ts may import from this module.
 *
 * Seed set is docs/screen-specs.md §4, extended with the eleven-field
 * mandatory drug set from Design System §7 ("Search/picker result row"):
 * name, content, dose, form, manufacturer, batch, expiry, current stock,
 * rack, MRP, PTR.
 *
 * Salts and schedule follow docs/salt-model.md V4 §3-4: `salts` and
 * `product_composition` are normalised entities; schedule classification is
 * never a flat property — it's a `salt_schedule_rule` (a bounded predicate
 * over strength range, unit and dosage form, effective-dated), resolved
 * through the layer order in §4.1. `UNSPECIFIED` is a real, explicit
 * classification (§3.4) — "nobody has classified this yet" — distinct from
 * `NONE` ("determined: not scheduled"). Per §3.4, every salt carries at
 * least one rule; zero rules for a salt is a data defect, not a meaning.
 *
 * Two products exist purely to exercise states the real 14 don't naturally
 * have — see the comments at their definitions. Per direct instruction: no
 * real molecule gets an invented regulatory fact, even one clearly labelled
 * "illustrative" in a code comment — a disclaimer doesn't travel with a
 * number if someone copies it later, so both demo salts are fictional.
 *
 * GST rate and PTR here are seed values only, same caveat as screen-specs.md
 * §4's GST note: every rate, HSN map and invoice format is effective-dated
 * config from the rules engine at runtime, never a hardcoded constant in a
 * real screen. PTR is derived here as MRP / 1.16 (an illustrative ~16%
 * retailer margin) purely to have a plausible number in the seed — it is not
 * a real price list. `authorityRef`/`note` on schedule rules are similarly
 * illustrative seed placeholders, not verified gazette citations.
 */

export type ScheduleValue = "NARCOTIC" | "X" | "H1" | "H" | "NONE" | "UNSPECIFIED"
export type DeterminedSchedule = Exclude<ScheduleValue, "UNSPECIFIED">

export type Salt = {
  id: string
  /** Proper case. Render uppercase in CONTENT — a display rule (Design
   *  System §7 / Salt Model §11), not a stored-data convention. */
  name: string
  /** Master data (`kemist`) vs shop-added (`shop`) — Salt Model §2, §3.1.
   *  `aliases` is omitted: an ingest-pipeline/matching field with no
   *  consumer yet in this frontend mock. */
  source: "kemist" | "shop"
}

/** One salt's contribution to a product's composition, in order. Strength
 *  and unit belong to THIS salt only (Salt Model §11) — never pair a
 *  strength with a salt it wasn't measured against. `unit` is the literal
 *  suffix to concatenate directly after `strength` (e.g. strength "40",
 *  unit "mg" -> "40mg"; strength "250", unit " IU" -> "250 IU" — the space
 *  convention lives in the unit string itself). */
export type CompositionItem = {
  saltId: string
  strength: string
  unit: string
}

/** A bounded predicate (Salt Model §3.3), deliberately not a rule
 *  expression language — every row must be readable and verifiable by a
 *  non-programmer regulatory reviewer. `effectiveFrom`/`effectiveTo` are
 *  "YYYY-MM-DD" strings, compared lexicographically — that only works
 *  because the format is fixed-width and zero-padded. */
export type SaltScheduleRule = {
  id: string
  saltId: string
  schedule: ScheduleValue
  /** Inclusive. NULL = no lower bound. */
  minStrength: number | null
  /** Exclusive. NULL = no upper bound. */
  maxStrength: number | null
  /** Required when either bound is set. */
  strengthUnit: string | null
  /** NULL = any form. */
  dosageForm: string | null
  effectiveFrom: string
  /** NULL = in force. */
  effectiveTo: string | null
  source: "kemist" | "shop"
  /** Gazette notification or rule reference. Illustrative placeholder in
   *  this seed — see module doc comment. */
  authorityRef: string | null
  /** Required in spirit on `shop` rows. */
  reason: string | null
  note: string | null
}

/** A shop's product-level decision, in any direction, including
 *  `UNSPECIFIED` (Salt Model §3.5). Empty in this seed — nothing here needs
 *  a populated override, and inventing one would exercise a state nobody
 *  asked for. */
export type ProductScheduleOverride = {
  productId: string
  schedule: ScheduleValue
  reason: string
  actorId: string
  actorRole: "Pharmacist" | "Owner"
  effectiveFrom: string
  createdAt: string
}

export type Batch = {
  batchNo: string
  /** YYYY-MM. Month granularity only, per Design System §5 ("Expiry as MM-YYYY"). */
  expiry: string
  /** On hand, in the product's native pack unit. */
  qty: number
  mrp: number
  /** Price to retailer — seed value only, see module doc comment. */
  ptr: number
}

export type Product = {
  id: string
  /** Brand name as printed on the pack, e.g. "Dolo 650". */
  name: string
  /** Ordered salt+strength composition. Empty for a non-drug product (a
   *  device, e.g. a glucometer) that has no salt at all. */
  composition: CompositionItem[]
  form:
    | "Tablet"
    | "Capsule"
    | "Gel"
    | "Liquid"
    | "Diagnostic Device"
  manufacturer: string
  /** Free-text pack description, e.g. "15 tab" or "1 tube". Not one of the
   *  eleven mandatory fields, kept because it's already in the screen-specs
   *  seed table and is useful context. */
  pack: string
  /** Seed value only — see module doc comment. */
  gstRate: number
  rack: string
  /** Conventionally kept oldest-expiry-first (FEFO order). */
  batches: Batch[]
}

export const SALTS: Salt[] = [
  { id: "paracetamol", name: "Paracetamol", source: "kemist" },
  { id: "amoxycillin", name: "Amoxycillin", source: "kemist" },
  { id: "clavulanic-acid", name: "Clavulanic Acid", source: "kemist" },
  { id: "pantoprazole", name: "Pantoprazole", source: "kemist" },
  { id: "domperidone", name: "Domperidone", source: "kemist" },
  { id: "calcium-carbonate", name: "Calcium Carbonate", source: "kemist" },
  { id: "vitamin-d3", name: "Vitamin D3", source: "kemist" },
  { id: "telmisartan", name: "Telmisartan", source: "kemist" },
  { id: "montelukast", name: "Montelukast", source: "kemist" },
  { id: "levocetirizine", name: "Levocetirizine", source: "kemist" },
  { id: "aceclofenac", name: "Aceclofenac", source: "kemist" },
  { id: "metformin", name: "Metformin", source: "kemist" },
  { id: "glimepiride", name: "Glimepiride", source: "kemist" },
  { id: "azithromycin", name: "Azithromycin", source: "kemist" },
  { id: "alprazolam", name: "Alprazolam", source: "kemist" },
  { id: "cetirizine", name: "Cetirizine", source: "kemist" },
  { id: "phenylephrine", name: "Phenylephrine", source: "kemist" },
  { id: "diclofenac-diethylamine", name: "Diclofenac Diethylamine", source: "kemist" },
  { id: "chloroxylenol", name: "Chloroxylenol", source: "kemist" },
  { id: "terpineol", name: "Terpineol", source: "kemist" },
  // Fictional — invented solely to exercise the UNSPECIFIED state (Salt
  // Model §3.4). Not a real molecule; do not treat as one.
  { id: "herboclear-compound", name: "Herboclear Compound", source: "shop" },
  // Fictional — invented solely to exercise a dose-banded rule (Salt Model
  // §3.3/§4.2). Not a real molecule; do not treat as one, and do not read
  // the strength threshold below as a real regulatory fact about anything.
  { id: "zentrophen", name: "Zentrophen", source: "kemist" },
]

const ILLUSTRATIVE = "Seed placeholder — illustrative only, not a verified gazette citation."

/**
 * Every salt above carries at least one rule (Salt Model §3.4 — zero rules
 * is a data defect, not a meaning). `NONE` is asserted only for the six
 * salts where "not scheduled" is genuinely safe and well-known: paracetamol,
 * calcium carbonate, vitamin D3, cetirizine, chloroxylenol, terpineol.
 * Everywhere else a real salt was previously modelled `NONE` purely because
 * it rides along as an adjunct in a combination product (clavulanic acid,
 * domperidone, levocetirizine, metformin) or otherwise wasn't actually
 * verified (diclofenac diethylamine), it is `UNSPECIFIED` instead — `NONE`
 * asserts a determined regulatory fact nobody checked, which is the same
 * problem a fabricated real-molecule threshold would have been.
 * `herboclear-compound` also gets the UNSPECIFIED state (a genuinely new
 * shop-added salt, per §3.4's own example, rather than an unverified
 * existing one). `zentrophen` gets two adjoining, non-overlapping bands so
 * the bounded-predicate resolver actually has bounds to evaluate.
 */
export const SALT_SCHEDULE_RULES: SaltScheduleRule[] = [
  { id: "r-paracetamol", saltId: "paracetamol", schedule: "NONE", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Reviewed; not scheduled. " + ILLUSTRATIVE },
  { id: "r-amoxycillin", saltId: "amoxycillin", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-clavulanic-acid", saltId: "clavulanic-acid", schedule: "UNSPECIFIED", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Adjunct to amoxycillin; classification not independently verified. UNSPECIFIED, not NONE — nobody has confirmed this is unscheduled (Salt Model V4 §3.4)." },
  { id: "r-pantoprazole", saltId: "pantoprazole", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-domperidone", saltId: "domperidone", schedule: "UNSPECIFIED", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Adjunct to pantoprazole; classification not independently verified. UNSPECIFIED, not NONE (Salt Model V4 §3.4)." },
  { id: "r-calcium-carbonate", saltId: "calcium-carbonate", schedule: "NONE", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Reviewed; not scheduled. " + ILLUSTRATIVE },
  { id: "r-vitamin-d3", saltId: "vitamin-d3", schedule: "NONE", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Reviewed; not scheduled. " + ILLUSTRATIVE },
  { id: "r-telmisartan", saltId: "telmisartan", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-montelukast", saltId: "montelukast", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-levocetirizine", saltId: "levocetirizine", schedule: "UNSPECIFIED", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Adjunct to montelukast; classification not independently verified. UNSPECIFIED, not NONE (Salt Model V4 §3.4)." },
  { id: "r-aceclofenac", saltId: "aceclofenac", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-metformin", saltId: "metformin", schedule: "UNSPECIFIED", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Adjunct to glimepiride; classification not independently verified. UNSPECIFIED, not NONE (Salt Model V4 §3.4)." },
  { id: "r-glimepiride", saltId: "glimepiride", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-azithromycin", saltId: "azithromycin", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-alprazolam", saltId: "alprazolam", schedule: "H1", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-cetirizine", saltId: "cetirizine", schedule: "NONE", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Reviewed; not scheduled. " + ILLUSTRATIVE },
  { id: "r-phenylephrine", saltId: "phenylephrine", schedule: "H", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: ILLUSTRATIVE },
  { id: "r-diclofenac-diethylamine", saltId: "diclofenac-diethylamine", schedule: "UNSPECIFIED", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Topical NSAID; classification not independently verified for this seed. UNSPECIFIED, not NONE (Salt Model V4 §3.4)." },
  { id: "r-chloroxylenol", saltId: "chloroxylenol", schedule: "NONE", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Antiseptic; not a scheduled drug. " + ILLUSTRATIVE },
  { id: "r-terpineol", saltId: "terpineol", schedule: "NONE", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: null, reason: null, note: "Antiseptic adjunct; not a scheduled drug. " + ILLUSTRATIVE },

  // UNSPECIFIED demo (Salt Model §3.4: "a new shop-created salt gets one
  // row: schedule = UNSPECIFIED, no bounds, effective today").
  { id: "r-herboclear-compound", saltId: "herboclear-compound", schedule: "UNSPECIFIED", minStrength: null, maxStrength: null, strengthUnit: null, dosageForm: null, effectiveFrom: "2026-08-01", effectiveTo: null, source: "shop", authorityRef: null, reason: "Newly added by shop; not yet reviewed.", note: "Fictional salt for demonstration — nobody has classified this yet." },

  // Dose-banded demo (Salt Model §3.3/§4.2) — two adjoining, non-overlapping
  // bands on the same fictional salt, in mg/5ml, liquid form only.
  { id: "r-zentrophen-low", saltId: "zentrophen", schedule: "H", minStrength: null, maxStrength: 10, strengthUnit: "mg/5ml", dosageForm: "Liquid", effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: "Fictional salt/threshold, invented solely to exercise the bounded-predicate resolver — no real drug or concentration threshold is implied." },
  { id: "r-zentrophen-high", saltId: "zentrophen", schedule: "H1", minStrength: 10, maxStrength: null, strengthUnit: "mg/5ml", dosageForm: "Liquid", effectiveFrom: "2020-01-01", effectiveTo: null, source: "kemist", authorityRef: "seed-placeholder", reason: null, note: "Fictional salt/threshold, invented solely to exercise the bounded-predicate resolver — no real drug or concentration threshold is implied." },
]

/** Empty — nothing in this seed needs a populated product-level override. */
export const PRODUCT_SCHEDULE_OVERRIDES: ProductScheduleOverride[] = []

export function saltById(id: string): Salt {
  const s = SALTS.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown salt id: ${id}`)
  return s
}

/** Resolves a product's composition array to its full salt records, in order. */
export function saltsFor(product: Product): { salt: Salt; item: CompositionItem }[] {
  return product.composition.map((item) => ({ salt: saltById(item.saltId), item }))
}

export const STOCK: Product[] = [
  {
    id: "dolo-650",
    name: "Dolo 650",
    composition: [{ saltId: "paracetamol", strength: "650", unit: "mg" }],
    form: "Tablet",
    manufacturer: "Micro Labs",
    pack: "15 tab",
    gstRate: 5,
    rack: "A1",
    // Batch depth per docs/screen-specs.md §4 ("Batch depth — Dolo 650, FEFO
    // order"): DL4102 (6) -> DL4421 FEFO default (41) -> DL4590 (120), total
    // 167. NOTE: the flat seed table in that same doc lists a single
    // Stock=47 for Dolo 650, which does not reconcile with this breakdown
    // (6+41+120=167). Flagging rather than silently picking one — this
    // seed follows the more detailed batch-depth breakdown since FEFO depth
    // is the whole point of that fixture; the flat table's "47" appears to
    // be stale relative to it.
    batches: [
      { batchNo: "DL4102", expiry: "2026-10", qty: 6, mrp: 31.0, ptr: 26.72 },
      { batchNo: "DL4421", expiry: "2027-08", qty: 41, mrp: 31.5, ptr: 27.16 },
      { batchNo: "DL4590", expiry: "2028-02", qty: 120, mrp: 32.0, ptr: 27.59 },
    ],
  },
  {
    id: "augmentin-625-duo",
    name: "Augmentin 625 Duo",
    composition: [
      { saltId: "amoxycillin", strength: "500", unit: "mg" },
      { saltId: "clavulanic-acid", strength: "125", unit: "mg" },
    ],
    form: "Tablet",
    manufacturer: "GSK",
    pack: "10 tab",
    gstRate: 5,
    rack: "A2",
    batches: [
      { batchNo: "AG9012", expiry: "2027-03", qty: 12, mrp: 223.42, ptr: 192.6 },
    ],
  },
  {
    id: "pan-d-capsule",
    name: "Pan-D",
    composition: [
      { saltId: "pantoprazole", strength: "40", unit: "mg" },
      { saltId: "domperidone", strength: "30", unit: "mg" },
    ],
    form: "Capsule",
    manufacturer: "Alkem",
    pack: "15 cap",
    gstRate: 5,
    rack: "B1",
    batches: [
      { batchNo: "PD7781", expiry: "2026-11", qty: 8, mrp: 212.0, ptr: 182.76 },
    ],
  },
  {
    id: "shelcal-500",
    name: "Shelcal 500",
    composition: [
      { saltId: "calcium-carbonate", strength: "500", unit: "mg" },
      { saltId: "vitamin-d3", strength: "250", unit: " IU" },
    ],
    form: "Tablet",
    manufacturer: "Torrent",
    pack: "15 tab",
    gstRate: 5,
    rack: "C1",
    batches: [
      { batchNo: "SC2210", expiry: "2028-01", qty: 63, mrp: 128.0, ptr: 110.34 },
    ],
  },
  {
    id: "telma-40",
    name: "Telma 40",
    composition: [{ saltId: "telmisartan", strength: "40", unit: "mg" }],
    form: "Tablet",
    manufacturer: "Glenmark",
    pack: "15 tab",
    gstRate: 5,
    rack: "C2",
    batches: [
      { batchNo: "TM5534", expiry: "2027-06", qty: 21, mrp: 148.0, ptr: 127.59 },
    ],
  },
  {
    id: "montek-lc",
    name: "Montek LC",
    composition: [
      { saltId: "montelukast", strength: "10", unit: "mg" },
      { saltId: "levocetirizine", strength: "5", unit: "mg" },
    ],
    form: "Tablet",
    manufacturer: "Sun Pharma",
    pack: "10 tab",
    gstRate: 5,
    rack: "D1",
    batches: [
      { batchNo: "ML8823", expiry: "2026-12", qty: 4, mrp: 212.0, ptr: 182.76 },
    ],
  },
  {
    id: "zerodol-sp",
    name: "Zerodol SP",
    composition: [
      { saltId: "aceclofenac", strength: "100", unit: "mg" },
      { saltId: "paracetamol", strength: "325", unit: "mg" },
    ],
    form: "Tablet",
    manufacturer: "Ipca",
    pack: "10 tab",
    gstRate: 5,
    rack: "A1",
    batches: [
      { batchNo: "ZS1190", expiry: "2026-09", qty: 0, mrp: 114.0, ptr: 98.28 },
    ],
  },
  {
    id: "glycomet-gp1",
    name: "Glycomet GP1",
    composition: [
      { saltId: "metformin", strength: "500", unit: "mg" },
      { saltId: "glimepiride", strength: "1", unit: "mg" },
    ],
    form: "Tablet",
    manufacturer: "USV",
    pack: "15 tab",
    gstRate: 5,
    rack: "B2",
    batches: [
      { batchNo: "GM4402", expiry: "2027-05", qty: 30, mrp: 132.0, ptr: 113.79 },
    ],
  },
  {
    id: "azithral-500",
    name: "Azithral 500",
    composition: [{ saltId: "azithromycin", strength: "500", unit: "mg" }],
    form: "Tablet",
    manufacturer: "Alembic",
    pack: "5 tab",
    gstRate: 5,
    rack: "A2",
    batches: [
      { batchNo: "AZ7745", expiry: "2027-02", qty: 18, mrp: 115.0, ptr: 99.14 },
    ],
  },
  {
    id: "alprax-0.25",
    name: "Alprax 0.25",
    composition: [{ saltId: "alprazolam", strength: "0.25", unit: "mg" }],
    form: "Tablet",
    manufacturer: "Torrent",
    pack: "15 tab",
    gstRate: 5,
    // Schedule H1 psychotropics are conventionally shelved apart from
    // general stock in an Indian pharmacy, not on the open therapeutic
    // shelves — hence a distinct rack series.
    rack: "H1-1",
    batches: [
      { batchNo: "AP3320", expiry: "2027-10", qty: 9, mrp: 42.0, ptr: 36.21 },
    ],
  },
  {
    id: "cheston-cold",
    name: "Cheston Cold",
    // Phenylephrine carries the schedule here, not cetirizine or
    // paracetamol — decongestant combinations are commonly Schedule H in
    // India even when the antihistamine/analgesic partners aren't
    // independently restricted.
    composition: [
      { saltId: "cetirizine", strength: "5", unit: "mg" },
      { saltId: "paracetamol", strength: "325", unit: "mg" },
      { saltId: "phenylephrine", strength: "5", unit: "mg" },
    ],
    form: "Tablet",
    manufacturer: "Cipla",
    pack: "10 tab",
    gstRate: 5,
    rack: "D1",
    batches: [
      { batchNo: "CC6612", expiry: "2027-04", qty: 25, mrp: 68.0, ptr: 58.62 },
    ],
  },
  {
    id: "volini-gel-30g",
    name: "Volini Gel 30g",
    composition: [
      { saltId: "diclofenac-diethylamine", strength: "1.16", unit: "% w/w" },
    ],
    form: "Gel",
    manufacturer: "Sun Pharma",
    pack: "1 tube",
    gstRate: 5,
    rack: "F1",
    batches: [
      { batchNo: "VG2204", expiry: "2027-07", qty: 14, mrp: 135.0, ptr: 116.38 },
    ],
  },
  {
    id: "dettol-100ml",
    name: "Dettol 100ml",
    composition: [
      { saltId: "chloroxylenol", strength: "4.8", unit: "% w/v" },
      { saltId: "terpineol", strength: "1", unit: "% w/v" },
    ],
    form: "Liquid",
    manufacturer: "Reckitt",
    pack: "1 bottle",
    gstRate: 18,
    rack: "F2",
    batches: [
      { batchNo: "DT9901", expiry: "2027-12", qty: 40, mrp: 58.0, ptr: 50.0 },
    ],
  },
  {
    id: "accu-chek-active",
    name: "Accu-Chek Active",
    // Not a drug — a glucose test-strip pack. No salts.
    composition: [],
    form: "Diagnostic Device",
    manufacturer: "Roche",
    pack: "1 pack",
    gstRate: 5,
    rack: "G1",
    batches: [
      { batchNo: "AC1123", expiry: "2027-03", qty: 6, mrp: 1180.0, ptr: 1017.24 },
    ],
  },

  // --- Demo-only products below: not part of the original screen-specs.md
  // §4 seed table, added solely to exercise UNSPECIFIED and dose-banded
  // resolution. Both salts are fictional (see SALTS above). ---
  {
    id: "herboclear-syrup",
    name: "Herboclear Syrup",
    composition: [{ saltId: "herboclear-compound", strength: "100", unit: "mg/5ml" }],
    form: "Liquid",
    manufacturer: "Demo Pharma",
    pack: "1 bottle",
    gstRate: 12,
    rack: "Z1",
    batches: [
      { batchNo: "HC1001", expiry: "2027-06", qty: 10, mrp: 95.0, ptr: 81.9 },
    ],
  },
  {
    id: "zentrophen-syrup",
    name: "Zentrophen Syrup",
    // 5mg/5ml falls below the 10mg/5ml threshold in SALT_SCHEDULE_RULES,
    // so this resolves through the "low" band (H) — proving the bound
    // matching runs, not just that an unconditional rule exists.
    composition: [{ saltId: "zentrophen", strength: "5", unit: "mg/5ml" }],
    form: "Liquid",
    manufacturer: "Demo Pharma",
    pack: "1 bottle",
    gstRate: 12,
    rack: "Z2",
    batches: [
      { batchNo: "ZN2002", expiry: "2027-09", qty: 15, mrp: 110.0, ptr: 94.83 },
    ],
  },
]

const NOW_M = new Date().getFullYear() * 12 + new Date().getMonth()

function monthsRemaining(expiry: string): number {
  const y = +expiry.slice(0, 4)
  const m = +expiry.slice(5, 7)
  return y * 12 + (m - 1) - NOW_M
}

function isDead(batch: Batch): boolean {
  return monthsRemaining(batch.expiry) < 0
}

/** First non-dead batch in FEFO order, or the first batch if every batch is dead. */
export function fefoBatch(product: Product): Batch {
  const live = product.batches.filter((b) => !isDead(b))
  return live[0] ?? product.batches[0]
}

/** Total on-hand across every non-dead batch. */
export function currentStock(product: Product): number {
  return product.batches.reduce((total, b) => total + (isDead(b) ? 0 : b.qty), 0)
}

const RESTRICTION_ORDER: DeterminedSchedule[] = ["NARCOTIC", "X", "H1", "H", "NONE"]

function moreRestrictive(a: DeterminedSchedule, b: DeterminedSchedule): DeterminedSchedule {
  return RESTRICTION_ORDER.indexOf(a) < RESTRICTION_ORDER.indexOf(b) ? a : b
}

function rulesForSalt(saltId: string): SaltScheduleRule[] {
  return SALT_SCHEDULE_RULES.filter((r) => r.saltId === saltId)
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** R1 ("nothing reads schedule without a date") rests on lexicographic
 *  comparison of date strings, which is only correct for a zero-padded,
 *  fixed-width YYYY-MM-DD. A comment doesn't stop a caller passing
 *  "2026-9-5" — this throws instead. */
export function parseIsoDate(date: string): string {
  if (!ISO_DATE_RE.test(date)) {
    throw new Error(
      `Invalid date "${date}": expected YYYY-MM-DD, zero-padded and fixed-width — ` +
        `effective-dated resolution compares dates lexicographically and is only correct for this exact shape.`
    )
  }
  return date
}

function activeOn(rule: SaltScheduleRule, date: string): boolean {
  const d = parseIsoDate(date)
  return d >= rule.effectiveFrom && (rule.effectiveTo === null || d < rule.effectiveTo)
}

function matchesConditions(
  rule: SaltScheduleRule,
  strength: string,
  unit: string,
  dosageForm: string
): boolean {
  if (rule.dosageForm !== null && rule.dosageForm !== dosageForm) return false
  if (rule.minStrength !== null || rule.maxStrength !== null) {
    // No cross-unit normalisation in this mock (Salt Model §13 open Q2, unresolved).
    if (rule.strengthUnit !== unit) return false
    const s = parseFloat(strength)
    if (rule.minStrength !== null && s < rule.minStrength) return false
    if (rule.maxStrength !== null && s >= rule.maxStrength) return false
  }
  return true
}

export type SaltResolution =
  | { kind: "determined"; schedule: DeterminedSchedule; rule: SaltScheduleRule }
  | { kind: "unspecified"; rule: SaltScheduleRule | null }
  /** Salt Model §4.6: the salt HAS active, condition-compatible-by-date
   *  rules, but none match this strength/form. Never silently unscheduled —
   *  over-restrict to the most restrictive of the salt's existing rules. */
  | { kind: "unresolved"; overRestrictedTo: DeterminedSchedule; rule: SaltScheduleRule }

/** Resolution layers per Salt Model §4.1: shop rules before kemist rules
 *  for this salt; a salt with zero rules at all is a data defect, treated
 *  as UNSPECIFIED and flagged (not this function's problem to raise the
 *  alert — that's a `drug_data_alert`, out of scope for this seed). */
export function resolveSalt(
  saltId: string,
  strength: string,
  unit: string,
  dosageForm: string,
  date: string
): SaltResolution {
  parseIsoDate(date)
  const all = rulesForSalt(saltId)
  if (all.length === 0) return { kind: "unspecified", rule: null }

  const active = all.filter((r) => activeOn(r, date))
  const bySource = [
    active.filter((r) => r.source === "shop"),
    active.filter((r) => r.source === "kemist"),
  ]

  for (const pool of bySource) {
    const matching = pool.filter((r) => matchesConditions(r, strength, unit, dosageForm))
    if (matching.length === 0) continue
    const unspecifiedRule = matching.find((r) => r.schedule === "UNSPECIFIED")
    if (unspecifiedRule) return { kind: "unspecified", rule: unspecifiedRule }
    const determined = matching as (SaltScheduleRule & { schedule: DeterminedSchedule })[]
    const best = determined.reduce((a, b) =>
      RESTRICTION_ORDER.indexOf(a.schedule) < RESTRICTION_ORDER.indexOf(b.schedule) ? a : b
    )
    return { kind: "determined", schedule: best.schedule, rule: best }
  }

  if (active.length === 0) return { kind: "unspecified", rule: null }

  // Rules exist and are date-active, but none match this strength/form: §4.6 gap.
  const best = active.reduce((a, b) => {
    const av: DeterminedSchedule = a.schedule === "UNSPECIFIED" ? "NONE" : a.schedule
    const bv: DeterminedSchedule = b.schedule === "UNSPECIFIED" ? "NONE" : b.schedule
    return RESTRICTION_ORDER.indexOf(av) < RESTRICTION_ORDER.indexOf(bv) ? a : b
  })
  const overRestrictedTo: DeterminedSchedule = best.schedule === "UNSPECIFIED" ? "NONE" : best.schedule
  return { kind: "unresolved", overRestrictedTo, rule: best }
}

export type ProductResolution = {
  classification: DeterminedSchedule
  /** False if any salt resolved to UNSPECIFIED (Salt Model §4.4). */
  complete: boolean
  unspecifiedSalts: string[]
  /** Salts that hit the §4.6 gap — each should raise an
   *  `unresolved_classification` alert in a real system. */
  unresolvedSalts: string[]
}

/** Most restrictive among determined values only — UNSPECIFIED is off the
 *  ladder (§4.3). Checks the product-level override (§3.5) first. */
export function resolveProduct(product: Product, date: string): ProductResolution {
  const validDate = parseIsoDate(date)
  const override = PRODUCT_SCHEDULE_OVERRIDES.find(
    (o) => o.productId === product.id && o.effectiveFrom <= validDate
  )
  if (override) {
    if (override.schedule === "UNSPECIFIED") {
      return { classification: "NONE", complete: false, unspecifiedSalts: ["(product override)"], unresolvedSalts: [] }
    }
    return { classification: override.schedule, complete: true, unspecifiedSalts: [], unresolvedSalts: [] }
  }

  let classification: DeterminedSchedule = "NONE"
  const unspecifiedSalts: string[] = []
  const unresolvedSalts: string[] = []

  for (const item of product.composition) {
    const res = resolveSalt(item.saltId, item.strength, item.unit, product.form, date)
    if (res.kind === "determined") {
      classification = moreRestrictive(classification, res.schedule)
    } else if (res.kind === "unspecified") {
      unspecifiedSalts.push(item.saltId)
    } else {
      unresolvedSalts.push(item.saltId)
      classification = moreRestrictive(classification, res.overRestrictedTo)
    }
  }

  return { classification, complete: unspecifiedSalts.length === 0, unspecifiedSalts, unresolvedSalts }
}
