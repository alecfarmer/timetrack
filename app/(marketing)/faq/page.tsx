"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ArrowRight } from "lucide-react"

const categories = [
  {
    name: "Product",
    questions: [
      {
        q: "How does GPS verification work?",
        a: "When an employee clocks in, KPR checks their GPS coordinates against configured geofence zones. You set the radius per location (default 200m). Works even with limited signal — entries queue offline and sync when reconnected.",
      },
      {
        q: "What devices does KPR support?",
        a: "KPR works on any modern smartphone (iOS 15+ and Android 10+) via our native-quality PWA. For shared workstations, Kiosk Mode lets multiple employees clock in from one device. Admin dashboard works on any desktop browser.",
      },
      {
        q: "Can employees use it on shared tablets?",
        a: "Yes — Kiosk Mode lets you set up a shared tablet at your location. Employees identify themselves by email to clock in/out. No individual app install needed.",
      },
      {
        q: "Does it work offline?",
        a: "Yes. When an employee has no internet connection, their clock-in/out is saved locally and automatically syncs when they reconnect. Entries queue with exponential backoff and retry for up to 7 days.",
      },
      {
        q: "What is the gamification system?",
        a: "KPR includes an optional engagement layer with XP, badges, streaks, and challenges. Employees earn XP for clocking in on time, maintaining streaks, and hitting milestones. Teams using KPR rewards see an average 23% improvement in attendance.",
      },
    ],
  },
  {
    name: "Compliance",
    questions: [
      {
        q: "How does the compliance engine work?",
        a: "You configure jurisdiction-specific rules (e.g., CA meal breaks after 5 hours, OR predictive scheduling). KPR automatically monitors and flags violations in real-time, and can block non-compliant clock-outs.",
      },
      {
        q: "Which labor laws does KPR support?",
        a: "KPR supports multi-jurisdiction policies including California meal/rest breaks, Oregon predictive scheduling, and federal overtime rules. Custom policies can be configured for any jurisdiction.",
      },
      {
        q: "Is KPR GDPR compliant?",
        a: "Yes. KPR is fully GDPR compliant. We process data lawfully, maintain transparency about data collection, honor data deletion requests, and store data in secure, encrypted facilities.",
      },
    ],
  },
  {
    name: "Billing",
    questions: [
      {
        q: "Is there a contract or commitment?",
        a: "No contracts. The Free plan is free forever. Pro is month-to-month — cancel anytime. Enterprise agreements are typically annual with custom terms.",
      },
      {
        q: "How does per-user pricing work?",
        a: "You're billed based on the number of active employees in your organization. If an employee is deactivated, they stop counting toward your bill the next billing cycle. Admins count as users.",
      },
      {
        q: "Can I switch plans at any time?",
        a: "Absolutely. Upgrade, downgrade, or cancel at any time from your admin settings. If you downgrade mid-cycle, you'll retain your current features until the end of the billing period.",
      },
      {
        q: "Do you offer discounts for nonprofits?",
        a: "Yes. We offer 50% off Pro for qualified nonprofits and educational institutions. Contact us with your organization details to apply.",
      },
    ],
  },
  {
    name: "Integration",
    questions: [
      {
        q: "What payroll systems do you integrate with?",
        a: "We export to Gusto, ADP, Paychex, QuickBooks, and generic CSV. You configure pay code mapping, rounding rules, and overtime thresholds per your organization's policies.",
      },
      {
        q: "Do you have an API?",
        a: "Yes. Pro plans get limited API access, and Enterprise plans get unlimited API access with webhooks. Our REST API covers all core operations — entries, employees, locations, and reports.",
      },
      {
        q: "Can I import data from another time tracking system?",
        a: "Yes. We support CSV imports for employee rosters and historical time entries. For Enterprise customers, we provide dedicated migration support.",
      },
    ],
  },
  {
    name: "Security",
    questions: [
      {
        q: "How is my data protected?",
        a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We perform regular penetration testing and security audits.",
      },
      {
        q: "Do you support SSO?",
        a: "Yes — SSO (SAML 2.0) and SCIM provisioning are available on the Enterprise plan. We support Okta, Azure AD, Google Workspace, and other SAML-compatible identity providers.",
      },
      {
        q: "Where is data stored?",
        a: "Data is stored in secure, encrypted data centers in the United States. Enterprise customers can request specific data residency requirements.",
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-medium pr-4">{q}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-60 pb-5" : "max-h-0"
        )}
      >
        <p className="text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredCategories = activeCategory
    ? categories.filter((c) => c.name === activeCategory)
    : categories

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about KPR.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeCategory === null
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveCategory(c.name)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeCategory === c.name
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {filteredCategories.map((category) => (
            <div key={category.name} className="mb-12 last:mb-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {category.name}
              </h2>
              {category.questions.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-8">
            Our team is here to help. Reach out and we&apos;ll get back to you within a business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline">Contact support</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
