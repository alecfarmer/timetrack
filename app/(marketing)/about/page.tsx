import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Lock, Eye, Globe, Zap, ScanFace } from "lucide-react"

const values = [
  {
    title: "Privacy-first",
    description:
      "We believe attendance tracking shouldn't mean surveillance. KPR tracks outcomes — not keystrokes, screenshots, or mouse movements. Employees see every data point collected about them.",
    icon: Lock,
  },
  {
    title: "Built for operators",
    description:
      "We build for the VP of Ops who needs to run payroll at 4pm, not the Fortune 500 committee that takes 6 months to decide. Simple setup, immediate value, no enterprise bloat.",
    icon: Zap,
  },
  {
    title: "Transparent by default",
    description:
      "Open pricing. No per-location fees. No hidden charges. The same philosophy applies to our product — every employee can see exactly what data KPR collects and why.",
    icon: Eye,
  },
  {
    title: "Scale without compromise",
    description:
      "Whether you have 5 employees or 5,000, the platform works the same. Multi-jurisdiction compliance, offline-first architecture, and sub-200ms API responses at any scale.",
    icon: Globe,
  },
]

const stats = [
  { value: "2,000+", label: "Teams" },
  { value: "50K+", label: "Daily clock events" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "Customer rating" },
]

const alumniLogos = [
  "Google",
  "Stripe",
  "Square",
  "Gusto",
  "Rippling",
  "ADP",
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            Attendance tracking that respects your team.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            KPR was built with a simple conviction: you can know who&apos;s on-site without
            treating your employees like suspects. We&apos;re building the attendance platform
            we&apos;d want to use ourselves.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Our mission
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">
              Time tracking shouldn&apos;t be adversarial.
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The legacy time and attendance industry was built on distrust — badge swipes to
                prove you showed up, biometric scans to prove you&apos;re you, and surveillance
                software to prove you&apos;re working.
              </p>
              <p>
                We think that&apos;s broken. Most employees want to do their jobs well. They
                don&apos;t need to be watched — they need tools that make attendance effortless and
                keep their employer compliant.
              </p>
              <p>
                KPR replaces the entire legacy stack with a single platform: GPS-verified
                clock-in, automated compliance, payroll integration, and an engagement layer that
                makes punctuality rewarding instead of punitive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              What we believe
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {values.map((value) => (
              <div key={value.title} className="bg-card p-8 sm:p-10">
                <value.icon className="h-6 w-6 text-foreground mb-5" />
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 sm:py-24 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team background */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Our team
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              Built by people who&apos;ve done this before.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our team has shipped workforce management, fintech, and compliance products at
              some of the best companies in the world.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {alumniLogos.map((name) => (
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

      {/* Security */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Security
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              Your data, protected.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We encrypt everything, comply with international privacy regulations, and never sell your data. Period.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              { icon: Lock, label: "Encryption", desc: "AES-256 encryption at rest and TLS 1.3 for all data in transit. Every request, every record." },
              { icon: Globe, label: "GDPR Compliant", desc: "Full compliance with the General Data Protection Regulation. Data portability, right to deletion, and transparent processing." },
              { icon: Eye, label: "Data Privacy", desc: "We never sell or share your data. Employees can see exactly what data is collected about them and why." },
              { icon: ScanFace, label: "SSO / SCIM", desc: "Enterprise identity management with SAML 2.0 single sign-on and SCIM provisioning for Okta, Azure AD, and Google Workspace." },
            ].map((item) => (
              <div key={item.label} className="bg-card p-8 sm:p-10">
                <item.icon className="h-6 w-6 text-foreground mb-5" />
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{item.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Join the teams who&apos;ve made the switch.
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Start free. No credit card required. See results in your first week.
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
