import { Button } from "@/components/ui/button"

// Throwaway token-verification page. Not a feature route — no i18n, no
// keyboard registry, no error boundary. Delete once tokens are confirmed.

type Swatch = { name: string; hex: string }

const baseTokens: Swatch[] = [
  { name: "--background", hex: "#fafaf9" },
  { name: "--foreground", hex: "#1c1c1a" },
  { name: "--card", hex: "#ffffff" },
  { name: "--card-foreground", hex: "#1c1c1a" },
  { name: "--popover", hex: "#ffffff" },
  { name: "--popover-foreground", hex: "#1c1c1a" },
  { name: "--primary", hex: "#2456e6" },
  { name: "--primary-foreground", hex: "#ffffff" },
  { name: "--secondary", hex: "#f4f4f3" },
  { name: "--secondary-foreground", hex: "#1c1c1a" },
  { name: "--muted", hex: "#f4f4f3" },
  { name: "--muted-foreground", hex: "#6e6e6a" },
  { name: "--accent", hex: "#f4f4f3" },
  { name: "--accent-foreground", hex: "#1c1c1a" },
  { name: "--destructive", hex: "#c6222f" },
  { name: "--destructive-foreground", hex: "#ffffff" },
  { name: "--border", hex: "#e4e4e2" },
  { name: "--input", hex: "#e4e4e2" },
  { name: "--ring", hex: "#2456e6" },
]

const sidebarTokens: Swatch[] = [
  { name: "--sidebar", hex: "→ k-surface #ffffff" },
  { name: "--sidebar-foreground", hex: "→ foreground #1c1c1a" },
  { name: "--sidebar-primary", hex: "→ k-brand #2456e6" },
  { name: "--sidebar-primary-foreground", hex: "→ k-surface #ffffff" },
  { name: "--sidebar-accent", hex: "→ k-surface-2 #f4f4f3" },
  { name: "--sidebar-accent-foreground", hex: "→ foreground #1c1c1a" },
  { name: "--sidebar-border", hex: "→ border #e4e4e2" },
  { name: "--sidebar-ring", hex: "→ ring #2456e6" },
]

const kemistTokens: Swatch[] = [
  { name: "--k-brand", hex: "#2456e6" },
  { name: "--k-brand-hover", hex: "#1b44bf" },
  { name: "--k-surface", hex: "#ffffff" },
  { name: "--k-surface-2", hex: "#f4f4f3" },
  { name: "--k-pos", hex: "#178a50" },
  { name: "--k-pos-bg", hex: "#e9f6ef" },
  { name: "--k-warn", hex: "#b96a00" },
  { name: "--k-warn-bg", hex: "#fcf3e3" },
  { name: "--k-neg", hex: "#c6222f" },
  { name: "--k-neg-bg", hex: "#fcebec" },
]

const chartTokens: Swatch[] = [
  { name: "--chart-1", hex: "#2456e6" },
  { name: "--chart-2", hex: "#5b82ee" },
  { name: "--chart-3", hex: "#92aef5" },
  { name: "--chart-4", hex: "#c0d0f9" },
  { name: "--chart-5", hex: "#e0e9fc" },
]

const typeScale = [
  { label: "display-total", px: 28, weight: 700 },
  { label: "h1", px: 20, weight: 600 },
  { label: "h2", px: 16, weight: 600 },
  { label: "body", px: 14, weight: 400 },
  { label: "grid cell", px: 13, weight: 400 },
  { label: "caption", px: 12, weight: 400 },
  { label: "hotkey chip", px: 11, weight: 500, uppercase: true },
]

const buttonVariants = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {items.map((t) => (
        <div key={t.name} className="flex flex-col gap-1">
          <div
            className="h-12 rounded-md border border-border"
            style={{ backgroundColor: `var(${t.name})` }}
          />
          <div className="text-[12px] font-medium text-foreground">
            {t.name}
          </div>
          <div className="font-mono text-[12px] text-muted-foreground">
            {t.hex}
          </div>
        </div>
      ))}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-8">
      <h2 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function App() {
  return (
    <div
      className="mx-auto flex max-w-[1366px] flex-col gap-8 bg-background p-8 text-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>
        Kemist token proof — throwaway, delete after review
      </h1>

      <Section title="Base / shadcn contract">
        <SwatchGrid items={baseTokens} />
      </Section>

      <Section title="Sidebar / menu (menuColor / menuAccent)">
        <SwatchGrid items={sidebarTokens} />
      </Section>

      <Section title="Kemist semantic state">
        <SwatchGrid items={kemistTokens} />
      </Section>

      <Section title="Charts (single hue, tints only)">
        <SwatchGrid items={chartTokens} />
      </Section>

      <Section title="Type scale">
        <div className="flex flex-col gap-3">
          {typeScale.map((t) => (
            <div key={t.label} className="flex items-baseline gap-4">
              <span className="w-32 shrink-0 text-[12px] text-muted-foreground">
                {t.label} · {t.px}/{t.weight}
              </span>
              <span
                style={{
                  fontSize: t.px,
                  fontWeight: t.weight,
                  lineHeight: 1.2,
                  textTransform: t.uppercase ? "uppercase" : "none",
                }}
              >
                Kemist billing counter
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Grid rows — 32px working vs 40px admin">
        <div className="flex flex-col border border-border">
          {["Paracetamol 650mg", "Azithromycin 500mg", "Cetirizine 10mg"].map(
            (name) => (
              <div
                key={name}
                className="k-grid-row flex items-center gap-4 px-3"
              >
                <span className="flex-1 text-[13px]">{name}</span>
                <span className="num flex-1 font-mono text-[13px]">
                  B-2291
                </span>
                <span className="num flex-1 text-[13px]">₹142.00</span>
              </div>
            )
          )}
        </div>
        <div className="flex flex-col border border-border">
          {["Store Manager", "Counter Staff"].map((name) => (
            <div
              key={name}
              className="flex items-center gap-4 border-b border-border px-3 text-[14px] last:border-b-0"
              style={{ height: "var(--k-row-admin)" }}
            >
              <span className="flex-1">{name}</span>
              <span className="flex-1 text-muted-foreground">Active</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons — every variant">
        <div className="flex flex-wrap items-center gap-3">
          {buttonVariants.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Money — tabular numerals, Indian grouping">
        <span className="num" style={{ fontSize: 28, fontWeight: 700 }}>
          ₹1,23,456.78
        </span>
      </Section>

      <Section title="Expiry — expired row vs near-expiry cell">
        <div className="flex flex-col border border-border">
          <div className="k-row-expired flex items-center gap-4 px-3" style={{ height: "var(--k-row)" }}>
            <span className="flex-1 text-[13px]">Amoxicillin 500mg</span>
            <span className="num flex-1 font-mono text-[13px]">B-1187</span>
            <span className="flex flex-1 items-center justify-end gap-2">
              <span className="num text-neg text-[13px]">05-03-2025</span>
              <span className="rounded-sm bg-neg px-1.5 py-0.5 text-[12px] font-semibold uppercase text-white">
                Expired
              </span>
            </span>
          </div>
          <div className="k-grid-row flex items-center gap-4 px-3">
            <span className="flex-1 text-[13px]">Ibuprofen 400mg</span>
            <span className="num flex-1 font-mono text-[13px]">B-2450</span>
            <span className="k-cell-near-expiry num flex-1 text-[13px]">
              14-10-2026
            </span>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default App
