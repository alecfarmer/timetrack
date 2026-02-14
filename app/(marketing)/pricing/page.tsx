"use client"

import Link from "next/link"
import { useState, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, ChevronDown } from "lucide-react"

// ============================================
// DATA
// ============================================

const tiers = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "forever",
    description: "For small teams getting started with GPS time tracking.",
    features: [
      "Up to 5 employees",
      "GPS clock-in/out",
      "Basic reporting",
      "Mobile app (iOS & Android)",
      "7-day entry history",
      "1 location",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 5,
    annualPrice: 4,
    period: "/user/mo",
    description: "For growing teams that need compliance, payroll, and analytics.",
    features: [
      "Unlimited employees",
      "Geofencing & photo verification",
      "Compliance engine",
      "Payroll integrations (Gusto, ADP, etc.)",
      "AI scheduling & team messaging",
      "Advanced analytics & reports",
      "Timesheet approvals",
      "Entry corrections & audit log",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    period: "",
    description: "For organizations with complex compliance and integration needs.",
    features: [
      "Everything in Pro",
      "Multi-jurisdiction policies",
      "SSO & SCIM provisioning",
      "Dedicated account manager",
      "Custom integrations & API access",
      "SLA guarantee (99.99%)",
      "Custom data retention",
      "On-premise deployment option",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
]

const comparisonCategories = [
  {
    name: "Core",
    features: [
      { name: "Employees", free: "5", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "Locations", free: "1", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "GPS clock-in/out", free: true, pro: true, enterprise: true },
      { name: "Mobile app", free: true, pro: true, enterprise: true },
      { name: "Entry history", free: "7 days", pro: "Unlimited", enterprise: "Unlimited" },
    ],
  },
  {
    name: "Compliance & Security",
    features: [
      { name: "Geofencing", free: false, pro: true, enterprise: true },
      { name: "Photo verification", free: false, pro: true, enterprise: true },
      { name: "Compliance engine", free: false, pro: true, enterprise: true },
      { name: "Multi-jurisdiction policies", free: false, pro: false, enterprise: true },
      { name: "Audit log", free: false, pro: true, enterprise: true },
      { name: "SSO / SCIM", free: false, pro: false, enterprise: true },
    ],
  },
  {
    name: "Payroll & Integration",
    features: [
      { name: "CSV export", free: true, pro: true, enterprise: true },
      { name: "Gusto / ADP / Paychex", free: false, pro: true, enterprise: true },
      { name: "QuickBooks", free: false, pro: true, enterprise: true },
      { name: "Custom integrations", free: false, pro: false, enterprise: true },
      { name: "API access", free: false, pro: "Limited", enterprise: "Unlimited" },
      { name: "Webhooks", free: false, pro: false, enterprise: true },
    ],
  },
  {
    name: "Features",
    features: [
      { name: "AI scheduling", free: false, pro: true, enterprise: true },
      { name: "Team messaging", free: false, pro: true, enterprise: true },
      { name: "Timesheet approvals", free: false, pro: true, enterprise: true },
      { name: "Entry corrections", free: false, pro: true, enterprise: true },
      { name: "Gamification (XP, badges)", free: false, pro: true, enterprise: true },
      { name: "Advanced analytics", free: false, pro: true, enterprise: true },
      { name: "Burnout monitoring", free: false, pro: false, enterprise: true },
    ],
  },
  {
    name: "Support",
    features: [
      { name: "Help center", free: true, pro: true, enterprise: true },
      { name: "Email support", free: true, pro: true, enterprise: true },
      { name: "Priority support", free: false, pro: true, enterprise: true },
      { name: "Dedicated account manager", free: false, pro: false, enterprise: true },
      { name: "SLA guarantee", free: false, pro: false, enterprise: true },
    ],
  },
]

const faqs = [
  {
    q: "Is there a free trial for Pro?",
    a: "Yes — Pro comes with a 14-day free trial. No credit card required. You can downgrade to Free at any time.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Absolutely. Upgrade, downgrade, or cancel at any time. If you downgrade mid-cycle, you'll retain Pro features until the end of your billing period.",
  },
  {
    q: "How does per-user pricing work?",
    a: "You're billed based on the number of active employees in your organization. Admins count as users. If an employee is deactivated, they stop counting toward your bill the next billing cycle.",
  },
  {
    q: "Do you offer discounts for nonprofits or education?",
    a: "Yes. We offer 50% off Pro for qualified nonprofits and educational institutions. Contact us at hello@kpr.app with your organization details.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex) and can arrange invoicing for Enterprise plans.",
  },
  {
    q: "Is my data secure?",
    a: "KPR is GDPR compliant. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never sell your data.",
  },
]

// ============================================
// COMPONENTS
// ============================================

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
          open ? "max-h-40 pb-5" : "max-h-0"
        )}
      >
        <p className="text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-foreground mx-auto" />
    ) : (
      <span className="text-muted-foreground/40">—</span>
    )
  }
  return <span className="text-sm">{value}</span>
}

// ============================================
// PAGE
// ============================================

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-4">
            Start free, scale as you grow.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            No hidden fees. No per-location charges. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                !annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Annual
              <span className="text-xs text-primary font-semibold">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const price = annual ? tier.annualPrice : tier.monthlyPrice
              return (
                <div
                  key={tier.name}
                  className={cn(
                    "rounded-xl p-6 sm:p-8 relative h-full flex flex-col",
                    tier.highlighted
                      ? "border-2 border-primary/30 bg-card shadow-sm"
                      : "border border-border bg-card"
                  )}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Popular
                    </span>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      {price !== null ? (
                        <>
                          <span className="text-4xl font-semibold">${price}</span>
                          {tier.period && (
                            <span className="text-muted-foreground text-sm">{tier.period}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-4xl font-semibold">Custom</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            tier.highlighted ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup" className="block">
                    <Button
                      variant={tier.highlighted ? "default" : "outline"}
                      className="w-full"
                    >
                      {tier.cta}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-16">
            Compare plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 pr-4 text-sm font-medium text-muted-foreground w-1/3">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold w-[22%]">Free</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold w-[22%]">Pro</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold w-[22%]">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((category) => (
                  <Fragment key={category.name}>
                    <tr>
                      <td
                        colSpan={4}
                        className="pt-8 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-border/50">
                        <td className="py-3.5 pr-4 text-sm">{feature.name}</td>
                        <td className="py-3.5 px-4 text-center">
                          <CellValue value={feature.free} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <CellValue value={feature.pro} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <CellValue value={feature.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-12">
            Frequently asked questions
          </h2>
          <div>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Start tracking in minutes.
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

