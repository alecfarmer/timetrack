"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { BrowserFrame } from "@/components/landing/browser-frame"
import { DashboardMockup, AdminMockup, RewardsMockup } from "@/components/landing/mockup-screens"
import { Button } from "@/components/ui/button"
import { motion, useInView } from "framer-motion"
import {
  Clock,
  Shield,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  Eye,
  Brain,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Briefcase,
  Scale,
  Sparkles,
  Zap,
  Smartphone,
  LayoutDashboard,
  Gift,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// DATA
// ============================================

const pillars = [
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "One-tap GPS-verified clock-in. No badge swipes, no buddy punching, no hardware. Works offline and syncs automatically.",
    href: "/features/time-tracking",
  },
  {
    icon: Scale,
    title: "Compliance Engine",
    description:
      "Multi-jurisdiction labor law compliance. California meal breaks, Oregon predictive scheduling — automatically enforced by location.",
    href: "/features/compliance",
  },
  {
    icon: Briefcase,
    title: "Payroll Integration",
    description:
      "Map time entries to pay codes and export to Gusto, ADP, Paychex, or QuickBooks. One click, zero manual entry.",
    href: "/features/payroll",
  },
]

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
    icon: Zap,
    title: "Gamification",
    description: "XP, badges, streaks, and challenges turn punctuality into engagement. 23% attendance lift on average.",
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

const showcaseBlocks = [
  {
    icon: Smartphone,
    label: "Employee App",
    title: "Clock in with one tap.",
    description:
      "GPS-verified attendance from any device. Employees see their hours, streaks, and rewards — all in a beautifully simple interface.",
    bullets: ["One-tap GPS clock-in", "Offline-first — syncs automatically", "Personal stats & history"],
    Mockup: DashboardMockup,
    url: "app.usekpr.com/dashboard",
  },
  {
    icon: LayoutDashboard,
    label: "Admin Dashboard",
    title: "See your entire team, live.",
    description:
      "Real-time visibility into who's on-site, who's late, and who's approaching overtime. Make decisions with live data, not stale spreadsheets.",
    bullets: ["Live activity feed", "Compliance monitoring", "One-click payroll export"],
    Mockup: AdminMockup,
    url: "app.usekpr.com/admin",
  },
  {
    icon: Gift,
    label: "Rewards & Gamification",
    title: "Make attendance engaging.",
    description:
      "XP, badges, streaks, and challenges turn punctuality into a game. Teams using KPR rewards see 23% higher attendance rates on average.",
    bullets: ["XP & leveling system", "Streak tracking with milestones", "Team challenges & leaderboards"],
    Mockup: RewardsMockup,
    url: "app.usekpr.com/rewards",
  },
]

const logoCloudNames = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Industries",
  "Wayne Enterprises",
  "Hooli",
  "Pied Piper",
  "Prestige Worldwide",
  "Sterling Cooper",
]

const metrics = [
  { value: "50K+", label: "Clock Events Daily" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<200ms", label: "API Response" },
  { value: "2,000+", label: "Teams Worldwide" },
]

// ============================================
// UTILITIES
// ============================================

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function ShowcaseBlock({ block, index }: { block: (typeof showcaseBlocks)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const reversed = index % 2 === 1

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center gap-12 lg:gap-16",
        reversed ? "lg:flex-row-reverse" : "lg:flex-row"
      )}
    >
      <div className="flex-1 text-center lg:text-left lg:max-w-md">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground mb-4">
          <block.icon className="h-3.5 w-3.5" />
          {block.label}
        </span>
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
          {block.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
          {block.description}
        </p>
        <ul className="space-y-3">
          {block.bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-3 justify-center lg:justify-start">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 w-full max-w-xl">
        <BrowserFrame url={block.url}>
          <block.Mockup />
        </BrowserFrame>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN
// ============================================

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push("/select-org")
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
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ==========================================
          HERO
          ========================================== */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid-lines mask-radial-faded opacity-50 dark:opacity-20" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center relative z-10">
          {/* Announcement */}
          <div
            className="animate-slide-up-fade"
            style={{ animationDelay: "0ms" }}
          >
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>AI Scheduling is here</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Headline */}
          <h1
            className="animate-slide-up-fade text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-6"
            style={{ animationDelay: "100ms" }}
          >
            Know who&apos;s on-site,{" "}
            <span className="text-gradient">in real time.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-slide-up-fade text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ animationDelay: "200ms" }}
          >
            GPS-verified attendance, automated compliance, and payroll integration.
            One platform for modern workforce management.
          </p>

          {/* CTAs */}
          <div
            className="animate-slide-up-fade flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            style={{ animationDelay: "300ms" }}
          >
            <Link href="/signup">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base">
              Get a demo
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Trust markers */}
          <div
            className="animate-slide-up-fade flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            style={{ animationDelay: "400ms" }}
          >
            {["No credit card required", "Free for up to 5 people", "Setup in 5 minutes"].map(
              (text) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>{text}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          LOGO CLOUD
          ========================================== */}
      <section className="py-12 border-y border-border overflow-hidden">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by 2,000+ teams worldwide
        </p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex animate-marquee w-max">
            {[...logoCloudNames, ...logoCloudNames].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-muted-foreground/25 font-bold text-sm tracking-wider uppercase mx-8 sm:mx-12 whitespace-nowrap select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          PRODUCT PILLARS
          ========================================== */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                The modern time &amp; attendance platform.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to track attendance, stay compliant, and run payroll —
                nothing you don&apos;t.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 0.08}>
                <div className="bg-card p-8 sm:p-10 h-full group hover:bg-muted/30 transition-colors">
                  <pillar.icon className="h-6 w-6 text-foreground mb-5" />
                  <h3 className="text-lg font-semibold mb-3 tracking-tight">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {pillar.description}
                  </p>
                  <Link
                    href={pillar.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:underline underline-offset-4"
                  >
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          FEATURES GRID
          ========================================== */}
      <section id="features" className="py-24 sm:py-32 border-t border-border scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground mb-6">
                <Zap className="h-3.5 w-3.5" />
                Core Platform
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                Built for scale.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From 5 employees to 5,000 — a complete platform that grows with you.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.05}>
                <div className="rounded-xl border border-border bg-card p-6 h-full hover:bg-muted/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-foreground mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Privacy card */}
          <Reveal delay={0.15}>
            <div className="mt-8 rounded-xl border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="font-semibold">Anti-Surveillance by Design</h3>
                  <p className="text-sm text-muted-foreground">
                    We track outcomes, not keystrokes.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  {
                    icon: Eye,
                    title: "Full Transparency",
                    desc: "Employees see every data point collected about them.",
                  },
                  {
                    icon: Shield,
                    title: "No Keylogging",
                    desc: "Never built. Never will be. Not a feature we turned off.",
                  },
                  {
                    icon: Brain,
                    title: "Outcome-Based",
                    desc: "Were they on-site? Did they meet hours? That's what matters.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==========================================
          PRODUCT SHOWCASE
          ========================================== */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-28 sm:space-y-36">
          <Reveal>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground mb-6">
                <Smartphone className="h-3.5 w-3.5" />
                Product Tour
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                See KPR in action.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From the factory floor to the front office.
              </p>
            </div>
          </Reveal>

          {showcaseBlocks.map((block, i) => (
            <ShowcaseBlock key={block.label} block={block} index={i} />
          ))}
        </div>
      </section>

      {/* ==========================================
          METRICS
          ========================================== */}
      <section className="py-20 sm:py-24 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
              {metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-semibold tabular-nums">{m.value}</p>
                  <p className="text-sm text-muted-foreground mt-2">{m.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==========================================
          TESTIMONIALS
          ========================================== */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                Trusted by teams everywhere.
              </h2>
              <p className="text-lg text-muted-foreground">
                See what operations leaders are saying about KPR.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.author} delay={i * 0.08}>
                <div className="rounded-xl border border-border bg-card p-6 h-full">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          CTA
          ========================================== */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Ready to modernize attendance?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join 2,000+ teams who switched from spreadsheets and badge swipes to KPR.
              Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link href="/signup">
                <Button size="lg" className="gap-2 h-12 px-8 text-base">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base">
                Get a demo
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              {["G2 Leader 2025", "4.9/5 Stars", "AES-256 Encrypted", "GDPR Compliant"].map(
                (badge) => (
                  <div key={badge} className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{badge}</span>
                  </div>
                )
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
