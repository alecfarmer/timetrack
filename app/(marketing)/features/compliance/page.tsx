import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  Scale,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react"

const features = [
  {
    title: "Multi-jurisdiction labor law",
    description:
      "Configure overtime thresholds, meal break requirements, and rest period rules for every jurisdiction where you operate. Resolution chain: jurisdiction-specific policy, then org default, then hardcoded federal defaults.",
    icon: Scale,
  },
  {
    title: "Meal and rest break enforcement",
    description:
      "Automatically track meal and rest break compliance by jurisdiction. Get alerts when employees approach break deadlines, and flag violations before they become fines.",
    icon: Clock,
  },
  {
    title: "Predictive scheduling compliance",
    description:
      "Meet fair workweek requirements in cities like San Francisco, New York, and Seattle. Track schedule changes, required notice periods, and premium pay obligations automatically.",
    icon: FileText,
  },
  {
    title: "Complete audit log",
    description:
      "Every admin action is recorded with timestamp, actor, and details. Entry edits, approvals, policy changes, and role modifications are all logged and exportable for audits or litigation.",
    icon: ShieldCheck,
  },
]

const steps = [
  {
    number: "01",
    title: "Select your jurisdictions",
    description:
      "Choose the states, cities, or counties where your team works. KPR loads the relevant labor law defaults automatically.",
  },
  {
    number: "02",
    title: "Customize thresholds",
    description:
      "Adjust overtime thresholds, break durations, and scheduling notice periods to match your specific policies or collective bargaining agreements.",
  },
  {
    number: "03",
    title: "Monitor compliance in real time",
    description:
      "The admin dashboard surfaces compliance risks as they happen — approaching overtime, missed breaks, and scheduling violations — so you can act before a penalty.",
  },
]

const highlights = [
  "FLSA, state, and municipal labor law coverage",
  "Automatic overtime calculation by jurisdiction",
  "Break compliance alerts before violations occur",
  "Predictive scheduling for fair workweek laws",
  "Tamper-proof audit trail for every data change",
  "Exportable compliance reports for auditors",
]

export default function CompliancePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            Labor law compliance on autopilot.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Multi-jurisdiction overtime rules, break enforcement, predictive
            scheduling, and a tamper-proof audit log — so you stay compliant
            without spreadsheets or guesswork.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Compliance engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Every rule. Every jurisdiction. One platform.
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
              Set it up once. Stay compliant forever.
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
                Compliance without the complexity.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Most compliance failures happen because rules are spread across
                spreadsheets, HR handbooks, and institutional memory. KPR
                centralizes it all and enforces it automatically.
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
            Stop worrying about compliance violations.
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
