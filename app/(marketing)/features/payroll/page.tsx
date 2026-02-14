import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  Link2,
  FileSpreadsheet,
  Calculator,
  RefreshCw,
} from "lucide-react"

const features = [
  {
    title: "One-click payroll export",
    description:
      "Export verified time data directly to Gusto, ADP, Paychex, or QuickBooks. Map your pay codes, set rounding rules, and run payroll in minutes instead of hours.",
    icon: Link2,
  },
  {
    title: "Pay code mapping",
    description:
      "Map KPR entry types to your payroll provider's pay codes. Regular time, overtime, double time, PTO, holidays — configured once and applied automatically to every export.",
    icon: FileSpreadsheet,
  },
  {
    title: "Configurable rounding rules",
    description:
      "Round clock-in and clock-out times to the nearest 5, 6, or 15 minutes using standard, up, or down rounding. Set different rules per location or employee group.",
    icon: Calculator,
  },
  {
    title: "CSV and custom export",
    description:
      "Need a format we don't natively support? Export clean CSV files with customizable columns, date ranges, and groupings. Works with any payroll system that accepts imports.",
    icon: RefreshCw,
  },
]

const steps = [
  {
    number: "01",
    title: "Connect your payroll provider",
    description:
      "Select Gusto, ADP, Paychex, or QuickBooks from the integrations menu. Authenticate with your payroll credentials and KPR handles the rest.",
  },
  {
    number: "02",
    title: "Map your pay codes",
    description:
      "Match KPR entry types to the pay codes your payroll provider expects. Set overtime thresholds, rounding rules, and any location-specific overrides.",
  },
  {
    number: "03",
    title: "Export and run payroll",
    description:
      "When the pay period ends, review the summary, click export, and your payroll system receives clean, verified time data. No manual entry, no rekeying, no errors.",
  },
]

const highlights = [
  "Native Gusto, ADP, Paychex, and QuickBooks support",
  "Customizable CSV export for any payroll system",
  "Automatic overtime calculation before export",
  "Rounding rules configurable per location",
  "Pay period summaries with approval status",
  "Full audit trail from clock-in to paycheck",
]

export default function PayrollPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            From clock-in to paycheck. Seamless.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Export verified time data to Gusto, ADP, Paychex, or QuickBooks with
            one click. Pay code mapping, rounding rules, and overtime
            calculations are handled automatically.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Integrations
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Your time data, wherever your payroll lives.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card p-8 sm:p-10">
                <feature.icon className="h-6 w-6 text-foreground mb-5" />
                <h3 className="text-lg font-semibold mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported providers */}
      <section className="py-20 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              Works with the tools you already use
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {["Gusto", "ADP", "Paychex", "QuickBooks", "CSV"].map((name) => (
              <span
                key={name}
                className="text-muted-foreground/30 font-bold text-sm tracking-wider uppercase"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Payroll in three steps.
            </h2>
          </div>

          <div className="space-y-12">
            {steps.map((step) => (
              <div
                key={step.number}
                className="md:grid md:grid-cols-[80px_1fr] md:gap-8"
              >
                <div className="mb-3 md:mb-0">
                  <span className="text-3xl font-semibold text-muted-foreground/30">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="md:grid md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                No more rekeying time data.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Manual payroll data entry is slow, error-prone, and costs real
                money in corrections. KPR eliminates it entirely with verified,
                one-click exports.
              </p>
            </div>
            <ul className="space-y-4 mt-8 md:mt-0">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Run payroll in minutes, not hours.
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Free for up to 5 employees. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 h-12 px-8 text-base">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
