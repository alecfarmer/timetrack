import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  BarChart3,
  TrendingUp,
  Heart,
  FileBarChart,
} from "lucide-react"

const features = [
  {
    title: "Team analytics dashboard",
    description:
      "See attendance patterns, average hours, and location breakdown across your entire team. Filter by date range, department, location, or individual employee.",
    icon: BarChart3,
  },
  {
    title: "Punctuality and overtime trends",
    description:
      "Track late arrivals, early departures, and overtime trends over time. Spot patterns before they become problems — like a team consistently clocking overtime every Thursday.",
    icon: TrendingUp,
  },
  {
    title: "Burnout monitoring",
    description:
      "Composite burnout scores based on consecutive work days, overtime hours, break skips, and average daily hours. Flag at-risk employees before exhaustion affects performance.",
    icon: Heart,
  },
  {
    title: "Custom reports",
    description:
      "Build reports with the fields that matter to your business. Export to CSV or schedule recurring reports delivered by email. No analyst required.",
    icon: FileBarChart,
  },
]

const steps = [
  {
    number: "01",
    title: "Collect data automatically",
    description:
      "Every clock event, break, overtime hour, and location check-in feeds into your analytics engine. No manual data entry or imports needed.",
  },
  {
    number: "02",
    title: "Review insights on your dashboard",
    description:
      "The admin analytics dashboard surfaces the metrics that matter most — attendance rates, overtime costs, punctuality scores, and burnout risk — all updated in real time.",
  },
  {
    number: "03",
    title: "Act on the data",
    description:
      "Use insights to optimize schedules, reduce overtime costs, prevent burnout, and reward your most consistent team members through the gamification system.",
  },
]

const metrics = [
  { value: "23%", label: "Average attendance improvement" },
  { value: "40%", label: "Reduction in overtime costs" },
  { value: "2x", label: "Faster payroll processing" },
  { value: "90%", label: "Employee adoption rate" },
]

const highlights = [
  "Real-time team attendance overview",
  "Overtime trend analysis with cost projections",
  "Late arrival and early departure tracking",
  "Burnout risk scoring per employee",
  "Exportable reports in CSV format",
  "Historical data with unlimited retention on Pro",
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            See what your time data is telling you.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Punctuality trends, overtime analysis, burnout monitoring, and
            custom reports — built on the attendance data you are already
            collecting.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {metrics.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-semibold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Analytics suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              From raw time data to actionable insights.
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

      {/* How it works */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Insights that surface automatically.
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
                Data-driven workforce management.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Most teams collect time data but never analyze it. KPR turns
                every clock event into insight — helping you reduce costs,
                prevent burnout, and build a healthier team.
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
            Start making better decisions today.
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
