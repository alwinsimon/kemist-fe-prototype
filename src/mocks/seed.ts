/**
 * Shop stock — the only source of data today (see CLAUDE.md "The seam").
 * Nothing outside src/api/client.ts may import from this module.
 *
 * Seed set is docs/screen-specs.md §4 ("Use these in every screen. A chemist
 * reading the prototype must recognise every line."), extended with the
 * eleven-field mandatory drug set from Design System §7 ("Search/picker
 * result row"): name, content, dose, form, manufacturer, batch, expiry,
 * current stock, rack, MRP, PTR.
 *
 * GST rate and PTR here are seed values only, same caveat as screen-specs.md
 * §4's GST note: every rate, HSN map and invoice format is effective-dated
 * config from the rules engine at runtime, never a hardcoded constant in a
 * real screen. PTR is derived here as MRP / 1.16 (an illustrative ~16%
 * retailer margin) purely to have a plausible number in the seed — it is not
 * a real price list.
 */

export type ScheduleTag = "H" | "H1" | null

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
  /** Salt / generic composition, proper case. Render uppercase — a display
   *  rule (Design System §7), not a stored-data convention. "—" for a
   *  non-drug product (a device, e.g. a glucometer) that has no salt. */
  content: string
  /** Free-text strength. Units vary by dosage form. */
  dose: string
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
  schedule: ScheduleTag
  rack: string
  /** Conventionally kept oldest-expiry-first (FEFO order). */
  batches: Batch[]
}

export const STOCK: Product[] = [
  {
    id: "dolo-650",
    name: "Dolo 650",
    content: "Paracetamol",
    dose: "650 mg",
    form: "Tablet",
    manufacturer: "Micro Labs",
    pack: "15 tab",
    gstRate: 5,
    schedule: null,
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
    content: "Amoxycillin + Clavulanic Acid",
    dose: "500 mg + 125 mg",
    form: "Tablet",
    manufacturer: "GSK",
    pack: "10 tab",
    gstRate: 5,
    schedule: "H",
    rack: "A2",
    batches: [
      { batchNo: "AG9012", expiry: "2027-03", qty: 12, mrp: 223.42, ptr: 192.6 },
    ],
  },
  {
    id: "pan-d-capsule",
    name: "Pan-D",
    content: "Pantoprazole + Domperidone",
    dose: "40 mg + 30 mg",
    form: "Capsule",
    manufacturer: "Alkem",
    pack: "15 cap",
    gstRate: 5,
    schedule: "H",
    rack: "B1",
    batches: [
      { batchNo: "PD7781", expiry: "2026-11", qty: 8, mrp: 212.0, ptr: 182.76 },
    ],
  },
  {
    id: "shelcal-500",
    name: "Shelcal 500",
    content: "Calcium Carbonate + Vitamin D3",
    dose: "500 mg + 250 IU",
    form: "Tablet",
    manufacturer: "Torrent",
    pack: "15 tab",
    gstRate: 5,
    schedule: null,
    rack: "C1",
    batches: [
      { batchNo: "SC2210", expiry: "2028-01", qty: 63, mrp: 128.0, ptr: 110.34 },
    ],
  },
  {
    id: "telma-40",
    name: "Telma 40",
    content: "Telmisartan",
    dose: "40 mg",
    form: "Tablet",
    manufacturer: "Glenmark",
    pack: "15 tab",
    gstRate: 5,
    schedule: "H",
    rack: "C2",
    batches: [
      { batchNo: "TM5534", expiry: "2027-06", qty: 21, mrp: 148.0, ptr: 127.59 },
    ],
  },
  {
    id: "montek-lc",
    name: "Montek LC",
    content: "Montelukast + Levocetirizine",
    dose: "10 mg + 5 mg",
    form: "Tablet",
    manufacturer: "Sun Pharma",
    pack: "10 tab",
    gstRate: 5,
    schedule: "H",
    rack: "D1",
    batches: [
      { batchNo: "ML8823", expiry: "2026-12", qty: 4, mrp: 212.0, ptr: 182.76 },
    ],
  },
  {
    id: "zerodol-sp",
    name: "Zerodol SP",
    content: "Aceclofenac + Paracetamol",
    dose: "100 mg + 325 mg",
    form: "Tablet",
    manufacturer: "Ipca",
    pack: "10 tab",
    gstRate: 5,
    schedule: null,
    rack: "A1",
    batches: [
      { batchNo: "ZS1190", expiry: "2026-09", qty: 0, mrp: 114.0, ptr: 98.28 },
    ],
  },
  {
    id: "glycomet-gp1",
    name: "Glycomet GP1",
    content: "Metformin + Glimepiride",
    dose: "500 mg + 1 mg",
    form: "Tablet",
    manufacturer: "USV",
    pack: "15 tab",
    gstRate: 5,
    schedule: "H",
    rack: "B2",
    batches: [
      { batchNo: "GM4402", expiry: "2027-05", qty: 30, mrp: 132.0, ptr: 113.79 },
    ],
  },
  {
    id: "azithral-500",
    name: "Azithral 500",
    content: "Azithromycin",
    dose: "500 mg",
    form: "Tablet",
    manufacturer: "Alembic",
    pack: "5 tab",
    gstRate: 5,
    schedule: "H",
    rack: "A2",
    batches: [
      { batchNo: "AZ7745", expiry: "2027-02", qty: 18, mrp: 115.0, ptr: 99.14 },
    ],
  },
  {
    id: "alprax-0.25",
    name: "Alprax 0.25",
    content: "Alprazolam",
    dose: "0.25 mg",
    form: "Tablet",
    manufacturer: "Torrent",
    pack: "15 tab",
    gstRate: 5,
    schedule: "H1",
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
    content: "Cetirizine + Paracetamol + Phenylephrine",
    dose: "5 mg + 325 mg + 5 mg",
    form: "Tablet",
    manufacturer: "Cipla",
    pack: "10 tab",
    gstRate: 5,
    schedule: null,
    rack: "D1",
    batches: [
      { batchNo: "CC6612", expiry: "2027-04", qty: 25, mrp: 68.0, ptr: 58.62 },
    ],
  },
  {
    id: "volini-gel-30g",
    name: "Volini Gel 30g",
    content: "Diclofenac Diethylamine",
    dose: "1.16% w/w",
    form: "Gel",
    manufacturer: "Sun Pharma",
    pack: "1 tube",
    gstRate: 5,
    schedule: null,
    rack: "F1",
    batches: [
      { batchNo: "VG2204", expiry: "2027-07", qty: 14, mrp: 135.0, ptr: 116.38 },
    ],
  },
  {
    id: "dettol-100ml",
    name: "Dettol 100ml",
    content: "Chloroxylenol + Terpineol",
    dose: "4.8% w/v",
    form: "Liquid",
    manufacturer: "Reckitt",
    pack: "1 bottle",
    gstRate: 18,
    schedule: null,
    rack: "F2",
    batches: [
      { batchNo: "DT9901", expiry: "2027-12", qty: 40, mrp: 58.0, ptr: 50.0 },
    ],
  },
  {
    id: "accu-chek-active",
    name: "Accu-Chek Active",
    // Not a drug — a glucose test-strip pack. No salt/generic composition.
    content: "—",
    dose: "50 strips",
    form: "Diagnostic Device",
    manufacturer: "Roche",
    pack: "1 pack",
    gstRate: 5,
    schedule: null,
    rack: "G1",
    batches: [
      { batchNo: "AC1123", expiry: "2027-03", qty: 6, mrp: 1180.0, ptr: 1017.24 },
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
