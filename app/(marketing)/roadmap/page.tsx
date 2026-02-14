import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const changelog = [
  {
    date: "February 2026",
    entries: [
      {
        title: "AI Scheduling",
        description:
          "Auto-generate fair schedules based on employee availability, skills, labor rules, and historical patterns. Supports weekly and bi-weekly rotations with one-click publish.",
        tag: "New",
      },
      {
        title: "Team messaging",
        description:
          "Built-in channels for shift updates, announcements, and direct messages. Keeps communication where the work happens.",
        tag: "New",
      },
    ],
  },
  {
    date: "January 2026",
    entries: [
      {
        title: "Burnout monitoring dashboard",
        description:
          "Admins can now track burnout risk across their team. Scoring is based on consecutive work days, overtime hours, break skips, and average daily hours.",
        tag: "New",
      },
      {
        title: "Entry corrections workflow",
        description:
          "Employees can request corrections to past entries. Smart auto-approval based on correction history. Full audit trail for every change.",
        tag: "New",
      },
      {
        title: "Improved dashboard performance",
        description:
          "Dashboard stats now update dynamically while clocked in. Fixed active session detection and optimized N+1 query patterns across admin views.",
        tag: "Improvement",
      },
    ],
  },
  {
    date: "December 2025",
    entries: [
      {
        title: "Gamification system",
        description:
          "Complete XP, badges, streaks, and challenges system. Employees earn rewards for punctuality, consistency, and milestones. Early data shows 23% average attendance improvement.",
        tag: "New",
      },
      {
        title: "Multi-jurisdiction compliance",
        description:
          "PolicyConfig now supports jurisdiction-specific labor law compliance including overtime thresholds, meal/rest breaks, and predictive scheduling. Resolution chain: jurisdiction → org default → hardcoded defaults.",
        tag: "New",
      },
    ],
  },
  {
    date: "November 2025",
    entries: [
      {
        title: "Payroll export integrations",
        description:
          "One-click payroll export to Gusto, ADP, Paychex, and QuickBooks. Configure pay code mapping, rounding rules, and overtime thresholds per org.",
        tag: "New",
      },
      {
        title: "Timesheet approval workflow",
        description:
          "Weekly timesheet submission and approval workflow for admins. Employees submit, admins review and approve or reject with comments.",
        tag: "New",
      },
      {
        title: "Photo verification",
        description:
          "Optional selfie capture at clock-in for identity verification. Photos stored securely and visible only to admins.",
        tag: "New",
      },
    ],
  },
  {
    date: "October 2025",
    entries: [
      {
        title: "Complete app redesign",
        description:
          "New design system with warm teal and cream palette. Redesigned employee dashboard, admin portal, and all navigation. Mobile-first with bottom nav and center clock FAB.",
        tag: "Improvement",
      },
      {
        title: "Offline-first architecture",
        description:
          "IndexedDB queue stores pending entries when offline. Auto-syncs on reconnect with exponential backoff, max 5 retries, 7-day expiry.",
        tag: "New",
      },
    ],
  },
]

const upcoming = [
  {
    title: "Kiosk Mode",
    description: "Set up a shared tablet for teams without individual phones. Employees identify by PIN or email.",
    status: "In development",
  },
  {
    title: "Slack & Teams integration",
    description: "Clock in/out from Slack or Microsoft Teams with slash commands. Get notifications in your channels.",
    status: "Planned",
  },
  {
    title: "Advanced break tracking",
    description: "Track paid vs unpaid breaks, auto-deduct meal periods, and enforce minimum break durations by jurisdiction.",
    status: "Planned",
  },
  {
    title: "Custom report builder",
    description: "Build, save, and schedule custom reports with drag-and-drop fields. Export to CSV, PDF, or email.",
    status: "Planned",
  },
  {
    title: "Multi-language support",
    description: "Employee app available in Spanish, French, Portuguese, and Mandarin. Admin dashboard in English.",
    status: "Researching",
  },
]

function TagBadge({ tag }: { tag: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
        tag === "New"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {tag}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "In development": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "Planned": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "Researching": "bg-muted text-muted-foreground",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colors[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-4">
            Changelog
          </h1>
          <p className="text-lg text-muted-foreground">
            All the latest updates, improvements, and fixes to KPR.
          </p>
        </div>
      </section>

      {/* Upcoming */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Coming soon
          </h2>
          <div className="space-y-4">
            {upcoming.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Changelog */}
      <section className="pb-24 sm:pb-32 border-t border-border pt-16 sm:pt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-10">
            Recent releases
          </h2>

          {changelog.map((month) => (
            <div key={month.date} className="mb-16 last:mb-0">
              <div className="md:grid md:grid-cols-[180px_1fr] md:gap-8">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm font-medium text-muted-foreground md:sticky md:top-24">
                    {month.date}
                  </p>
                </div>
                <div className="space-y-6">
                  {month.entries.map((entry) => (
                    <div key={entry.title}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{entry.title}</h3>
                        <TagBadge tag={entry.tag} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {entry.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="border-border mt-12" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Want to shape what we build next?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start using KPR and tell us what your team needs. We ship fast.
          </p>
          <Link href="/signup">
            <Button className="gap-2">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
