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
  { name: "--primary", hex: "#127a4a" },
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
  { name: "--sidebar-foreground", hex: "→ k-ink #1c1c1a" },
  { name: "--sidebar-primary", hex: "→ k-brand #127a4a" },
  { name: "--sidebar-primary-foreground", hex: "→ k-surface #ffffff" },
  { name: "--sidebar-accent", hex: "→ k-surface-2 #f4f4f3" },
  { name: "--sidebar-accent-foreground", hex: "→ k-ink #1c1c1a" },
  { name: "--sidebar-border", hex: "→ k-border #e4e4e2" },
  { name: "--sidebar-ring", hex: "→ ring #2456e6" },
]

const brandTokens: Swatch[] = [
  { name: "--k-brand", hex: "#127a4a" },
  { name: "--k-brand-hover", hex: "#0d6039" },
  { name: "--k-brand-bg", hex: "#eff7f2" },
  { name: "--k-brand-line", hex: "#cbe6d8" },
]

const interactiveTokens: Swatch[] = [
  { name: "--k-interactive", hex: "#2456e6" },
  { name: "--k-interactive-hover", hex: "#1b44bf" },
  { name: "--k-interactive-bg", hex: "#f2f5fe" },
]

const stateTokens: Swatch[] = [
  { name: "--k-pos", hex: "#178a50" },
  { name: "--k-pos-bg", hex: "#e9f6ef" },
  { name: "--k-warn", hex: "#b96a00" },
  { name: "--k-warn-700", hex: "#8a5000" },
  { name: "--k-warn-50", hex: "#fdf8ee" },
  { name: "--k-warn-100", hex: "#fbf0dc" },
  { name: "--k-warn-200", hex: "#f7e4be" },
  { name: "--k-neg", hex: "#c6222f" },
  { name: "--k-neg-bg", hex: "#fcebec" },
]

const chartTokens: Swatch[] = [
  { name: "--chart-1", hex: "#127a4a · sales" },
  { name: "--chart-2", hex: "#2456e6 · purchases" },
  { name: "--chart-3", hex: "#c6222f · returns" },
  { name: "--chart-4", hex: "#b96a00 · pending" },
  { name: "--chart-5", hex: "#5b82ee · categorical" },
]

const typeScale = [
  { label: "display-total", px: 28, weight: 700 },
  { label: "h1", px: 20, weight: 600 },
  { label: "h2", px: 16, weight: 600 },
  { label: "body", px: 14, weight: 400 },
  { label: "grid cell", px: 14, weight: 400 },
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

const expiryRows = [
  { name: "Amoxicillin 500mg", batch: "B-1187", rowClass: "k-row-expired", badgeClass: "k-expiry-badge--expired", badge: "−12d", label: "Expired" },
  { name: "Ibuprofen 400mg", batch: "B-2450", rowClass: "k-row-expiry-30", badgeClass: "k-expiry-badge--30", badge: "19d", label: "≤30 days" },
  { name: "Azithromycin 500mg", batch: "B-3312", rowClass: "k-row-expiry-60", badgeClass: "k-expiry-badge--60", badge: "52d", label: "31–60 days" },
  { name: "Cetirizine 10mg", batch: "B-4409", rowClass: "k-row-expiry-90", badgeClass: "k-expiry-badge--90", badge: "88d", label: "61–90 days" },
  { name: "Paracetamol 650mg", batch: "B-5501", rowClass: "", badgeClass: "", badge: "", label: ">90 days — no tint, no badge" },
]

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

      <Section title="Base / shadcn contract (primary is now brand green)">
        <SwatchGrid items={baseTokens} />
      </Section>

      <Section title="Sidebar / menu (active nav now brand green)">
        <SwatchGrid items={sidebarTokens} />
      </Section>

      <Section title="Brand (identity + primary action)">
        <SwatchGrid items={brandTokens} />
      </Section>

      <Section title="Interactive (where you are — unchanged, still blue)">
        <SwatchGrid items={interactiveTokens} />
      </Section>

      <Section title="State — success (transient only) / caution (banded) / stop">
        <SwatchGrid items={stateTokens} />
      </Section>

      <Section title="Charts (semantic — sales/purchases/returns/pending/categorical)">
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

      <Section title="Grid rows — 32px working (14px text) vs 40px admin">
        <div className="flex flex-col border border-border">
          {["Paracetamol 650mg", "Azithromycin 500mg", "Cetirizine 10mg"].map(
            (name) => (
              <div key={name} className="k-grid-row flex items-center gap-4 px-3">
                <span className="flex-1">{name}</span>
                <span className="num flex-1 font-mono">B-2291</span>
                <span className="num flex-1">₹142.00</span>
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

      <Section title="Buttons — every variant (default is now brand green)">
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

      <Section title="Expiry — the banded system, all four bands plus the plain case">
        <div className="flex flex-col border border-border">
          {expiryRows.map((r) => (
            <div
              key={r.batch}
              className={`k-grid-row flex items-center gap-4 px-3 ${r.rowClass}`}
            >
              <span className="flex-1">{r.name}</span>
              <span className="num flex-1 font-mono">{r.batch}</span>
              <span className="flex flex-1 items-center justify-end gap-2">
                <span className="text-[12px] text-muted-foreground">
                  {r.label}
                </span>
                {r.badge && (
                  <span className={`k-expiry-badge ${r.badgeClass}`}>
                    {r.badge}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

export default App
