import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Scale, Briefcase, BarChart3, CalendarDays } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "One-tap GPS-verified clock-in. No badge swipes, no buddy punching, no hardware. Works offline and syncs automatically.",
    href: "/features/time-tracking",
  },
  {
    icon: Scale,
    title: "Compliance",
    description:
      "Multi-jurisdiction labor law compliance. Meal breaks, overtime rules, and predictive scheduling — automatically enforced.",
    href: "/features/compliance",
  },
  {
    icon: Briefcase,
    title: "Payroll",
    description:
      "Export to Gusto, ADP, Paychex, or QuickBooks. Configure pay codes, rounding rules, and overtime thresholds.",
    href: "/features/payroll",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Punctuality trends, overtime analysis, burnout monitoring, and custom reports — all in real-time dashboards.",
    href: "/features/analytics",
  },
  {
    icon: CalendarDays,
    title: "Scheduling",
    description:
      "AI-powered shift scheduling with availability management, team messaging, and one-click publish.",
    href: "/features/scheduling",
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            Everything you need to manage attendance.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            From clock-in to payroll, KPR replaces your entire legacy time and attendance stack with a single modern platform.
          </p>
        </div>
      </section>

      {/* Features list */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="space-y-4">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group block rounded-xl border border-border bg-card p-6 sm:p-8 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-5">
                  <feature.icon className="h-6 w-6 text-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h2 className="text-lg font-semibold tracking-tight">{feature.title}</h2>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            See it in action.
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Start free. No credit card required. Set up in under 5 minutes.
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
