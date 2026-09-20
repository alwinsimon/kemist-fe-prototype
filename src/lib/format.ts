/**
 * The only bridge between ISO storage and DD-MM-YYYY display (Design System
 * §5). Storage stays ISO everywhere — YYYY-MM-DD for a full date, YYYY-MM
 * for expiry — because the schedule resolver (src/mocks/seed.ts) compares
 * effective dates lexicographically, which is correct only when the most
 * significant component is leftmost. "05-09-2026" < "12-03-2026" is true as
 * a string and false as a date; storing DD-MM-YYYY would silently break
 * every effective-date comparison R1 depends on. No component formats a
 * date inline — every rendered date goes through one of these.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_YEAR_MONTH_RE = /^\d{4}-\d{2}$/

/** "2026-09-05" -> "05-09-2026" */
export function formatDate(iso: string): string {
  if (!ISO_DATE_RE.test(iso)) {
    throw new Error(`Invalid date "${iso}": expected YYYY-MM-DD.`)
  }
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y}`
}

/** "2027-03" -> "03-2027" */
export function formatExpiry(isoYearMonth: string): string {
  if (!ISO_YEAR_MONTH_RE.test(isoYearMonth)) {
    throw new Error(`Invalid year-month "${isoYearMonth}": expected YYYY-MM.`)
  }
  const [y, m] = isoYearMonth.split("-")
  return `${m}-${y}`
}

/** "2027-03" -> "03-27" — the compact variant, same day-month-year order,
 *  two-digit year, for where space is genuinely tight (Design System §5). */
export function formatExpiryShort(isoYearMonth: string): string {
  if (!ISO_YEAR_MONTH_RE.test(isoYearMonth)) {
    throw new Error(`Invalid year-month "${isoYearMonth}": expected YYYY-MM.`)
  }
  const [y, m] = isoYearMonth.split("-")
  return `${m}-${y.slice(2)}`
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** `₹` with Indian digit grouping, two decimals always (Design System §5).
 *  e.g. 123456.7 -> "₹1,23,456.70". Uses Intl.NumberFormat — never hand-roll
 *  the grouping. */
export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount)
}
