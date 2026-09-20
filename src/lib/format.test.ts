import { describe, expect, it } from "vitest"
import { formatDate, formatExpiry, formatExpiryShort, formatMoney } from "./format"

describe("formatDate", () => {
  it("converts ISO YYYY-MM-DD to DD-MM-YYYY", () => {
    expect(formatDate("2026-09-05")).toBe("05-09-2026")
  })

  it("preserves zero-padding on single-digit day and month", () => {
    expect(formatDate("2027-01-02")).toBe("02-01-2027")
  })

  it("rejects a non-ISO date", () => {
    expect(() => formatDate("05-09-2026")).toThrow()
    expect(() => formatDate("2026-9-5")).toThrow()
    expect(() => formatDate("not-a-date")).toThrow()
  })
})

describe("formatExpiry", () => {
  it("converts ISO YYYY-MM to MM-YYYY", () => {
    expect(formatExpiry("2027-03")).toBe("03-2027")
  })

  it("rejects a non-ISO year-month", () => {
    expect(() => formatExpiry("03-2027")).toThrow()
    expect(() => formatExpiry("2027-3")).toThrow()
  })
})

describe("formatExpiryShort", () => {
  it("converts ISO YYYY-MM to the compact MM-YY variant", () => {
    expect(formatExpiryShort("2027-03")).toBe("03-27")
  })

  it("keeps day-month-year order, just a two-digit year", () => {
    expect(formatExpiryShort("2026-11")).toBe("11-26")
  })

  it("rejects a non-ISO year-month", () => {
    expect(() => formatExpiryShort("03-27")).toThrow()
  })
})

describe("formatMoney", () => {
  it("renders Indian digit grouping with two decimals", () => {
    expect(formatMoney(123456.7)).toBe("₹1,23,456.70")
  })

  it("always shows two decimals, even for a whole number", () => {
    expect(formatMoney(608)).toBe("₹608.00")
  })

  it("never uses Western (thousands) grouping", () => {
    expect(formatMoney(1000000)).toBe("₹10,00,000.00")
  })
})
