"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Clock,
  Shield,
  BarChart3,
  ArrowRight,
  Check,
  Trophy,
  Star,
  Eye,
  Brain,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Briefcase,
  Scale,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// DATA
// ============================================

const features = [
  {
    icon: Clock,
    title: "GPS Clock-In",
    description: "One-tap clock-in verified by GPS. No badge swipes, no buddy punching, no hardware.",
  },
  {
    icon: Scale,
    title: "Auto-Compliance",
    description: "California meal breaks, Oregon predictive scheduling — automatically enforced by location.",
  },
  {
    icon: Briefcase,
    title: "Payroll Export",
    description: "Map time to pay codes and export to Gusto, ADP, Paychex, or QuickBooks in one click.",
  },
  {
    icon: BarChart3,
    title: "Team Analytics",
    description: "Punctuality trends, attendance patterns, overtime analysis — all in real-time dashboards.",
  },
  {
    icon: Sparkles,
    title: "AI Scheduling",
    description: "Auto-generate fair schedules based on employee availability, skills, and labor rules.",
  },
  {
    icon: MessageSquare,
    title: "Team Messaging",
    description: "Built-in channels for shift updates, announcements, and team communication.",
  },
]

const testimonials = [
  {
    quote: "23% improvement in attendance within the first quarter. The gamification was the game-changer.",
    author: "Sarah Chen",
    role: "VP of Operations",
    company: "TechForward Inc.",
    avatar: "SC",
  },
  {
    quote: "The compliance engine flagged 3 potential violations in our first month. Saved us an estimated $45K.",
    author: "Marcus Johnson",
    role: "HR Director",
    company: "National Retail Co.",
    avatar: "MJ",
  },
  {
    quote: "Setup took 10 minutes. Our 200-person team was clocking in by lunch. Zero training needed.",
    author: "Emily Rodriguez",
    role: "COO",
    company: "FastGrow Logistics",
    avatar: "ER",
  },
]

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started",
    features: [
      "Up to 5 employees",
      "GPS clock-in/out",
      "Basic reporting",
      "Mobile app access",
      "7-day history",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4",
    period: "/user/mo",
    description: "For growing teams that need more",
    features: [
      "Unlimited employees",
      "Geofencing & photo verification",
      "Compliance engine",
      "Payroll integrations",
      "AI scheduling & messaging",
      "Advanced analytics",
      "Timesheet approvals",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with complex needs",
    features: [
      "Everything in Pro",
      "Multi-jurisdiction policies",
      "SSO & SCIM provisioning",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Book a Demo",
    highlighted: false,
  },
]

const faqs = [
  {
    q: "How does GPS verification work?",
    a: "When an employee clocks in, KPR checks their GPS coordinates against configured geofence zones. You set the radius per location (default 200m). Works even with limited signal — entries queue offline and sync when reconnected.",
  },
  {
    q: "What payroll systems do you integrate with?",
    a: "We export to Gusto, ADP, Paychex, QuickBooks, and generic CSV. You configure pay code mapping, rounding rules, and overtime thresholds per your organization's policies.",
  },
  {
    q: "Is there a contract or commitment?",
    a: "No contracts. The Free plan is free forever. Pro is month-to-month — cancel anytime. Enterprise agreements are typically annual with custom terms.",
  },
  {
    q: "How does the compliance engine work?",
    a: "You configure jurisdiction-specific rules (e.g., CA meal breaks after 5 hours, OR predictive scheduling). KPR automatically monitors and flags violations in real-time, and can block non-compliant clock-outs.",
  },
  {
    q: "Can employees use it on shared tablets?",
    a: "Yes — Kiosk Mode lets you set up a shared tablet at your location. Employees identify themselves by email to clock in/out. No individual app install needed.",
  },
]

// ============================================
// COMPONENTS
// ============================================

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-medium pr-4">{q}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ==========================================
          1. NAVIGATION
          ========================================== */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
          scrolled ? "bg-background/95 backdrop-blur-sm border-b" : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" />

            <div className="hidden md:flex items-center gap-6">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-1.5">
                  Start Free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ==========================================
          2. HERO
          ========================================== */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Know who&apos;s on-site,{" "}
              <span className="text-primary">in real time.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Replace badge swipes with GPS verification. Track attendance, ensure compliance,
              and run payroll — all from one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/signup">
                <Button size="lg" className="gap-2 font-semibold">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                Book a Demo
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["No credit card required", "Setup in 5 minutes", "Free for small teams"].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-16 pt-10 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground mb-6">
              Trusted by 2,000+ teams worldwide
            </p>
            <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
              {["Acme Corp", "Globex", "Initech", "Umbrella", "Stark Ind.", "Wayne Ent."].map((name) => (
                <span
                  key={name}
                  className="text-muted-foreground/30 font-bold text-sm tracking-wider uppercase"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          3. FEATURES GRID
          ========================================== */}
      <section id="features" className="py-20 sm:py-28 bg-muted/30 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-background text-sm font-medium mb-6">
              <Zap className="h-4 w-4 text-primary" />
              Core Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need, nothing you don&apos;t.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete time and attendance platform that scales from 5 employees to 5,000.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Trust points */}
          <div className="mt-16 rounded-xl border border-border/50 bg-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold">Anti-Surveillance by Design</h3>
                <p className="text-sm text-muted-foreground">We track outcomes, not keystrokes.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Eye, title: "Full Transparency", desc: "Employees see every data point collected about them." },
                { icon: Shield, title: "No Keylogging", desc: "Never built. Never will be. Not a feature we turned off." },
                { icon: Brain, title: "Outcome-Based", desc: "Were they on-site? Did they meet hours? That's what matters." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          4. SOCIAL PROOF
          ========================================== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Trusted by teams everywhere.
            </h2>
            <p className="text-lg text-muted-foreground">
              See what operations leaders are saying about KPR.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-xl border border-border/50 bg-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-border/50">
            {[
              { value: "50K+", label: "Clock Events Daily" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "<200ms", label: "API Response" },
              { value: "SOC 2", label: "Certified" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          5. PRICING
          ========================================== */}
      <section id="pricing" className="py-20 sm:py-28 bg-muted/30 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-background text-sm font-medium mb-6">
              <Trophy className="h-4 w-4 text-primary" />
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Start free, scale as you grow.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. No per-location charges. Just straightforward pricing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "rounded-xl p-6 sm:p-8 relative",
                  tier.highlighted
                    ? "border-2 border-primary/30 bg-card shadow-lg"
                    : "border border-border/50 bg-card"
                )}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={cn("h-4 w-4 shrink-0 mt-0.5", tier.highlighted ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="block">
                  <Button variant={tier.highlighted ? "default" : "outline"} className="w-full">
                    {tier.cta}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          6. FAQ
          ========================================== */}
      <section id="faq" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about KPR.
            </p>
          </div>

          <div>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          7. CTA + FOOTER
          ========================================== */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-primary px-8 py-16 sm:px-16 sm:py-20 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
              Ready to know who&apos;s on-site?
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-10">
              Stop guessing. Start tracking. Your team could be clocking in within minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 gap-2 font-semibold">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                Book a Demo
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Time Tracking", "Compliance", "Payroll", "Analytics", "Scheduling"].map((item) => (
                  <li key={item}>
                    <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {["Documentation", "API Reference", "Help Center", "Status"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Security", "GDPR"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} KPR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
