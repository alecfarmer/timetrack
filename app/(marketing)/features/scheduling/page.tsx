import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  CalendarDays,
  Sparkles,
  Users,
  MessageSquare,
} from "lucide-react"

const features = [
  {
    title: "AI-powered scheduling",
    description:
      "Auto-generate fair schedules based on employee availability, skills, labor rules, and historical patterns. Supports weekly and bi-weekly rotations with one-click publish.",
    icon: Sparkles,
  },
  {
    title: "Shift management",
    description:
      "Create, edit, and publish shifts from a visual calendar. Drag and drop to reassign. Employees get instant notifications when their schedule changes.",
    icon: CalendarDays,
  },
  {
    title: "Availability and time-off",
    description:
      "Employees submit their availability and PTO requests directly in the app. The scheduler accounts for approved time off automatically — no back-and-forth required.",
    icon: Users,
  },
  {
    title: "Team messaging",
    description:
      "Built-in channels for shift updates, announcements, and direct messages. Keep communication where the work happens instead of scattered across texts and emails.",
    icon: MessageSquare,
  },
]

const steps = [
  {
    number: "01",
    title: "Set your scheduling rules",
    description:
      "Define shift templates, minimum rest periods, max hours per week, and any jurisdiction-specific scheduling requirements. KPR respects these constraints automatically.",
  },
  {
    number: "02",
    title: "Generate or build your schedule",
    description:
      "Let the AI scheduler generate an optimized schedule, or build one manually with the visual calendar. Either way, employee availability and labor rules are enforced.",
  },
  {
    number: "03",
    title: "Publish and notify",
    description:
      "One click publishes the schedule and notifies your team. Employees see their upcoming shifts in the app, and any changes trigger instant notifications.",
  },
]

const highlights = [
  "AI schedule generation based on availability and skills",
  "Visual drag-and-drop shift calendar",
  "Employee availability and PTO integration",
  "Automatic labor law compliance checks",
  "Instant push notifications for schedule changes",
  "Built-in team messaging and announcements",
]

export default function SchedulingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            Scheduling that builds itself.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            AI-powered schedule generation, shift management, availability
            tracking, and team messaging — all in one place. Stop spending
            hours on next week&apos;s schedule.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Scheduling suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Build better schedules in a fraction of the time.
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
              From rules to published schedule in minutes.
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
                Scheduling + communication in one tool.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Most scheduling problems are communication problems. KPR keeps
                the schedule, availability, and team conversations in the same
                app — so nothing falls through the cracks.
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
            Stop wrestling with spreadsheet schedules.
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
