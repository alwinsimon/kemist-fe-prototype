import { describe, expect, it } from "vitest"
import { STOCK, parseIsoDate, resolveProduct, resolveSalt } from "./seed"

const TODAY = "2026-09-20"

function findProduct(id: string) {
  const p = STOCK.find((x) => x.id === id)
  if (!p) throw new Error(`Seed product not found: ${id}`)
  return p
}

describe("parseIsoDate", () => {
  it("accepts a zero-padded, fixed-width YYYY-MM-DD", () => {
    expect(parseIsoDate("2026-09-20")).toBe("2026-09-20")
  })

  it("rejects a non-zero-padded date (the exact case R1's comparison breaks on)", () => {
    expect(() => parseIsoDate("2026-9-5")).toThrow()
  })

  it("rejects garbage input", () => {
    expect(() => parseIsoDate("not-a-date")).toThrow()
    expect(() => parseIsoDate("")).toThrow()
  })
})

describe("resolveSalt — dose-banded rule (fictional salt: zentrophen)", () => {
  it("resolves the lower band below the threshold", () => {
    const res = resolveSalt("zentrophen", "5", "mg/5ml", "Liquid", TODAY)
    expect(res.kind).toBe("determined")
    expect(res).toMatchObject({ kind: "determined", schedule: "H" })
  })

  it("resolves the upper band above the threshold", () => {
    const res = resolveSalt("zentrophen", "20", "mg/5ml", "Liquid", TODAY)
    expect(res.kind).toBe("determined")
    expect(res).toMatchObject({ kind: "determined", schedule: "H1" })
  })

  it("treats minStrength as inclusive — exactly at the boundary resolves via the high-band rule", () => {
    const res = resolveSalt("zentrophen", "10", "mg/5ml", "Liquid", TODAY)
    expect(res.kind).toBe("determined")
    if (res.kind !== "determined") throw new Error("unreachable")
    expect(res.schedule).toBe("H1")
    expect(res.rule.id).toBe("r-zentrophen-high")
  })

  it("treats maxStrength as exclusive — exactly at the boundary does NOT resolve via the low-band rule", () => {
    const res = resolveSalt("zentrophen", "10", "mg/5ml", "Liquid", TODAY)
    if (res.kind !== "determined") throw new Error("unreachable")
    expect(res.rule.id).not.toBe("r-zentrophen-low")
  })

  it("falls through to the §4.6 gap when the dosage form doesn't match either band", () => {
    const res = resolveSalt("zentrophen", "5", "mg/5ml", "Tablet", TODAY)
    expect(res.kind).toBe("unresolved")
    if (res.kind !== "unresolved") throw new Error("unreachable")
    // Over-restricts to the most restrictive of the salt's existing rules.
    expect(res.overRestrictedTo).toBe("H1")
  })
})

describe("resolveSalt — UNSPECIFIED (fictional salt: herboclear-compound)", () => {
  it("resolves as unspecified, not as a determined classification", () => {
    const res = resolveSalt("herboclear-compound", "100", "mg/5ml", "Liquid", TODAY)
    expect(res.kind).toBe("unspecified")
  })
})

describe("resolveProduct", () => {
  it("an UNSPECIFIED salt makes the product incomplete", () => {
    const res = resolveProduct(findProduct("herboclear-syrup"), TODAY)
    expect(res.complete).toBe(false)
    expect(res.unspecifiedSalts).toContain("herboclear-compound")
  })

  it("one determined + one UNSPECIFIED salt yields the determined classification, incomplete", () => {
    // Augmentin 625 Duo: amoxycillin (H, determined) + clavulanic acid (UNSPECIFIED).
    const res = resolveProduct(findProduct("augmentin-625-duo"), TODAY)
    expect(res.classification).toBe("H")
    expect(res.complete).toBe(false)
    expect(res.unspecifiedSalts).toContain("clavulanic-acid")
  })

  it("most-restrictive-wins across a multi-salt product with several determined salts", () => {
    // Cheston Cold: cetirizine (NONE) + paracetamol (NONE) + phenylephrine (H).
    const res = resolveProduct(findProduct("cheston-cold"), TODAY)
    expect(res.classification).toBe("H")
    expect(res.complete).toBe(true)
  })

  it("rejects a malformed date the same way resolveSalt does", () => {
    expect(() => resolveProduct(findProduct("dolo-650"), "2026-9-5")).toThrow()
  })
})
