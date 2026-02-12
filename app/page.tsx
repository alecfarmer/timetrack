"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  MapPin,
  Clock,
  Shield,
  Users,
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Trophy,
  Star,
  Eye,
  Brain,
  Lock,
  Play,
  CheckCircle2,
  ArrowUpRight,
  Briefcase,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Scale,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// DATA
// ============================================

const stats = [
  { value: "50K+", label: "Clock Events Daily" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 200ms", label: "API Response" },
  { value: "SOC 2", label: "Certified" },
]

const featureTabs = [
  {
    id: "tracking",
    label: "Time Tracking",
    icon: Clock,
    headline: "One-tap clock-in, GPS verified.",
    description:
      "Employees clock in from their phone. GPS confirms they're on-site. No badge swipes, no buddy punching, no hardware.",
    bullets: [
      "GPS geofencing with configurable radius",
      "Offline-first — syncs when connection returns",
      "Optional photo verification for high-security sites",
      "Break tracking with policy enforcement",
    ],
    mockup: {
      type: "phone" as const,
      title: "Clock In",
      status: "Ready to clock in",
      primaryStat: "0h 0m",
      secondaryStat: "Today",
      buttonLabel: "Clock In",
      buttonColor: "bg-primary",
    },
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: Scale,
    headline: "Multi-jurisdiction, zero headaches.",
    description:
      "California meal breaks, Oregon predictive scheduling, NYC Fair Workweek — automatically enforced based on employee location.",
    bullets: [
      "State and city-level labor law rules",
      "Auto-enforced meal and rest breaks",
      "Overtime threshold monitoring",
      "Audit-ready compliance reporting",
    ],
    mockup: {
      type: "dashboard" as const,
      title: "Compliance Engine",
      items: [
        { region: "California", status: "Meal breaks enforced", color: "emerald" },
        { region: "Oregon", status: "Predictive scheduling", color: "purple" },
        { region: "New York City", status: "Fair Workweek compliant", color: "violet" },
      ],
      score: "100%",
    },
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: Briefcase,
    headline: "One-click payroll export.",
    description:
      "Map time entries to pay codes, apply rounding rules, and export directly to Gusto, ADP, Paychex, or QuickBooks.",
    bullets: [
      "Pre-built integrations with major providers",
      "Custom pay code mapping",
      "Configurable rounding rules",
      "Timesheet approval workflow",
    ],
    mockup: {
      type: "export" as const,
      title: "Payroll Export",
      providers: ["Gusto", "ADP", "Paychex", "QuickBooks"],
      lastExport: "Feb 7, 2026",
      totalHours: "1,247.5h",
    },
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    headline: "Insights that drive decisions.",
    description:
      "Punctuality trends, attendance patterns, overtime analysis, and team comparisons — all in real-time dashboards.",
    bullets: [
      "Punctuality scoring per employee",
      "Period-over-period trend analysis",
      "Overtime and burnout monitoring",
      "Exportable reports and charts",
    ],
    mockup: {
      type: "chart" as const,
      title: "Team Analytics",
      metrics: [
        { label: "Avg Punctuality", value: "94%", trend: "+3%" },
        { label: "Attendance Rate", value: "97%", trend: "+1%" },
        { label: "Overtime Hours", value: "12h", trend: "-8%" },
      ],
    },
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: Gamepad2,
    headline: "Turn attendance into achievement.",
    description:
      "Badges, XP levels, streaks, and weekly challenges keep your team engaged. Gamification that actually works.",
    bullets: [
      "67 unique badges across 8 categories",
      "10 XP levels with milestone rewards",
      "Streak tracking with bonus multipliers",
      "Weekly and monthly team challenges",
    ],
    mockup: {
      type: "gamification" as const,
      title: "Rewards",
      level: 7,
      levelName: "Star",
      xp: "4,250",
      badges: [
        { icon: "🔥", name: "On Fire" },
        { icon: "🐦", name: "Early Bird" },
        { icon: "💯", name: "Century" },
      ],
    },
  },
  {
    id: "admin",
    label: "Admin Portal",
    icon: LayoutDashboard,
    headline: "Full control, zero complexity.",
    description:
      "Live activity feed, team management, timesheet approvals, and org-wide settings — all from a single dashboard.",
    bullets: [
      "Real-time who's on-site view",
      "Bulk entry corrections with audit trail",
      "Feature flags per organization",
      "Role-based access control",
    ],
    mockup: {
      type: "admin" as const,
      title: "Admin Dashboard",
      onSite: 24,
      clockIns: 31,
      pending: 3,
      compliance: "98%",
    },
  },
]

const reviewPlatforms = [
  { name: "G2", rating: "4.8", reviews: "120+", badge: "High Performer" },
  { name: "Capterra", rating: "4.9", reviews: "85+", badge: "Best Value" },
  { name: "App Store", rating: "4.7", reviews: "200+", badge: "Editor's Choice" },
  { name: "Google Play", rating: "4.6", reviews: "150+", badge: "Top Rated" },
]

const testimonials = [
  {
    quote:
      "23% improvement in attendance within the first quarter. The gamification aspect was the game-changer our team needed.",
    author: "Sarah Chen",
    role: "VP of Operations",
    company: "TechForward Inc.",
    avatar: "SC",
  },
  {
    quote:
      "The compliance engine flagged 3 potential violations in our first month. Saved us an estimated $45K in penalties.",
    author: "Marcus Johnson",
    role: "HR Director",
    company: "National Retail Co.",
    avatar: "MJ",
  },
  {
    quote:
      "Setup took 10 minutes. Our 200-person team was clocking in by lunch. Zero training needed — it just works.",
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
      "Gamification & badges",
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
      "On-premise option",
    ],
    cta: "Book a Demo",
    highlighted: false,
  },
]

// ============================================
// ANIMATION VARIANTS
// ============================================

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

// ============================================
// SUB-COMPONENTS
// ============================================

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Glow behind phone */}
      <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/30 via-violet-500/20 to-blue-500/30 blur-3xl rounded-full" />

      {/* Phone frame */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[260px] sm:w-[280px] mx-auto"
      >
        <div className="rounded-[2.5rem] border-[3px] border-white/20 bg-gradient-to-b from-gray-900 to-gray-950 p-2 shadow-2xl shadow-black/50">
          {/* Screen */}
          <div className="rounded-[2rem] bg-gray-950 overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2">
              <span className="text-white/60 text-[10px] font-medium">9:41</span>
              <div className="w-20 h-5 rounded-full bg-black" />
              <div className="flex items-center gap-1">
                <div className="w-4 h-2.5 rounded-sm border border-white/40">
                  <div className="w-2.5 h-1.5 rounded-[1px] bg-green-400 ml-0.5 mt-[1px]" />
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="px-5 pb-6 pt-2">
              {/* Greeting */}
              <p className="text-white/50 text-xs">Good morning</p>
              <p className="text-white font-semibold text-base mb-4">Ready to clock in</p>

              {/* Clock button */}
              <div className="flex justify-center mb-5">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-white mx-auto mb-0.5" />
                    <span className="text-white text-[10px] font-semibold uppercase tracking-wider">
                      Clock In
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's hours */}
              <div className="text-center mb-4">
                <p className="text-white text-2xl font-bold tabular-nums">0h 00m</p>
                <p className="text-white/40 text-xs">Today</p>
              </div>

              {/* Week strip */}
              <div className="flex gap-1.5">
                {["M", "T", "W", "T", "F"].map((day, i) => (
                  <div
                    key={`${day}-${i}`}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-center",
                      i < 3
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-white/5 border border-white/10"
                    )}
                  >
                    <p className="text-[9px] text-white/40 mb-0.5">{day}</p>
                    <p
                      className={cn(
                        "text-[10px] font-semibold",
                        i < 3 ? "text-emerald-400" : "text-white/20"
                      )}
                    >
                      {i < 3 ? "8h" : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
      </motion.div>
    </div>
  )
}

function FeatureTabMockup({ tab }: { tab: (typeof featureTabs)[number] }) {
  if (tab.mockup.type === "phone") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{tab.mockup.title}</p>
            <p className="text-xs text-muted-foreground">{tab.mockup.status}</p>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <Clock className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums">{tab.mockup.primaryStat}</p>
          <p className="text-sm text-muted-foreground">{tab.mockup.secondaryStat}</p>
        </div>
      </div>
    )
  }

  if (tab.mockup.type === "dashboard") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{tab.mockup.title}</p>
            <p className="text-xs text-muted-foreground">Multi-jurisdiction coverage</p>
          </div>
        </div>
        <div className="space-y-3">
          {tab.mockup.items?.map((item) => (
            <div key={item.region} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  item.color === "emerald" && "bg-emerald-500",
                  item.color === "purple" && "bg-purple-500",
                  item.color === "violet" && "bg-violet-500"
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.region}</p>
                <p className="text-xs text-muted-foreground">{item.status}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Compliance</span>
          <span className="text-2xl font-bold text-emerald-500">{tab.mockup.score}</span>
        </div>
      </div>
    )
  }

  if (tab.mockup.type === "export") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{tab.mockup.title}</p>
            <p className="text-xs text-muted-foreground">
              Last export: {tab.mockup.lastExport}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {tab.mockup.providers?.map((p) => (
            <div
              key={p}
              className="p-3 rounded-xl bg-muted/50 text-center text-sm font-medium border border-border/50 hover:border-primary/30 transition-colors"
            >
              {p}
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground">Total Hours This Period</p>
          <p className="text-xl font-bold">{tab.mockup.totalHours}</p>
        </div>
      </div>
    )
  }

  if (tab.mockup.type === "chart") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold">{tab.mockup.title}</p>
        </div>
        <div className="space-y-3">
          {tab.mockup.metrics?.map((m) => (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="flex-1">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
              </div>
              <span
                className={cn(
                  "text-sm font-medium px-2 py-1 rounded-full",
                  m.trend?.startsWith("+")
                    ? "text-emerald-500 bg-emerald-500/10"
                    : "text-emerald-500 bg-emerald-500/10"
                )}
              >
                {m.trend}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (tab.mockup.type === "gamification") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <span className="text-2xl font-bold">{tab.mockup.level}</span>
            <span className="text-[8px] uppercase tracking-wider opacity-80">Level</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">{tab.mockup.levelName}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                {tab.mockup.xp} XP
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {tab.mockup.badges?.map((b) => (
            <div
              key={b.name}
              className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border/50 bg-muted/30"
            >
              <span className="text-xl">{b.icon}</span>
              <span className="text-[9px] font-medium text-muted-foreground">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // admin type
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-primary" />
        </div>
        <p className="font-semibold">{tab.mockup.title}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "On-Site", value: tab.mockup.onSite, color: "text-emerald-500" },
          { label: "Clock-Ins", value: tab.mockup.clockIns, color: "text-primary" },
          { label: "Pending", value: tab.mockup.pending, color: "text-amber-500" },
          { label: "Compliance", value: tab.mockup.compliance, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
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
  const heroRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState("tracking")
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

  // Scroll detection for nav background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Redirect authenticated users to dashboard
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
          1. STICKY NAVIGATION
          ========================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className={cn(
                "backdrop-blur-xl border border-border/50 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shadow-black/5 transition-colors duration-300",
                scrolled ? "bg-background/90" : "bg-background/70"
              )}
            >
              <Logo size="sm" />

              {/* Center nav links (desktop) */}
              <div className="hidden md:flex items-center gap-6">
                {[
                  { label: "Features", href: "#features" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Pricing", href: "#pricing" },
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
                  <Button variant="ghost" size="sm" className="rounded-xl text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="gradient"
                    size="sm"
                    className="rounded-xl gap-1.5 text-sm"
                  >
                    Start Free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ==========================================
          2. HERO (DARK GRADIENT, FULL VIEWPORT)
          ========================================== */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
      >
        {/* Always-dark background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0d0d1a]" />

        {/* Floating gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            }}
            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
            }}
            animate={{ x: [0, -40, 0], y: [0, -40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 60%)",
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-white"
              >
                Know who&apos;s on-site,{" "}
                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  in real time.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg sm:text-xl text-white/60 leading-relaxed max-w-xl mb-8"
              >
                Replace badge swipes with GPS verification. Track attendance,
                ensure compliance, and run payroll — all from one platform.
              </motion.p>

              {/* Dual CTAs */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-start gap-4 mb-8"
              >
                <Link href="/signup">
                  <Button
                    size="xl"
                    className="bg-white text-gray-900 hover:bg-white/90 gap-2 shadow-2xl shadow-white/10 font-semibold"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-2"
                >
                  <Play className="h-4 w-4" />
                  Book a Demo
                </Button>
              </motion.div>

              {/* Trust pills */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/40"
              >
                {[
                  "No credit card required",
                  "Setup in 5 minutes",
                  "Free for small teams",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="hidden lg:flex justify-center"
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ==========================================
          3. TRUST BAR
          ========================================== */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trusted by text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mb-8"
          >
            Trusted by 2,000+ teams worldwide
          </motion.p>

          {/* Placeholder logos */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mb-10 flex-wrap">
            {["Acme Corp", "Globex", "Initech", "Umbrella", "Stark Ind.", "Wayne Ent."].map(
              (name, i) => (
                <motion.span
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="text-muted-foreground/40 font-bold text-sm sm:text-base tracking-wider uppercase"
                >
                  {name}
                </motion.span>
              )
            )}
          </div>

          {/* Stat metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          4. TABBED FEATURE SHOWCASE
          ========================================== */}
      <section id="features" className="py-24 sm:py-32 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/50 text-sm font-medium mb-6">
              <Zap className="h-4 w-4 text-primary" />
              Core Platform
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Everything you need,
              <br />
              nothing you don&apos;t.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete time and attendance platform that scales from 5 employees
              to 5,000.
            </p>
          </motion.div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Tab pills */}
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto p-0 mb-12">
              {featureTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-medium transition-all border",
                    "data-[state=inactive]:bg-muted/50 data-[state=inactive]:border-border/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/25"
                  )}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab content */}
            {featureTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid lg:grid-cols-2 gap-12 items-center"
                  >
                    {/* Text side */}
                    <div>
                      <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        {tab.headline}
                      </h3>
                      <p className="text-lg text-muted-foreground mb-6">
                        {tab.description}
                      </p>
                      <ul className="space-y-3">
                        {tab.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-muted-foreground">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Mockup side */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl opacity-50" />
                        <div className="relative">
                          <FeatureTabMockup tab={tab} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* ==========================================
          5. ANTI-SURVEILLANCE / TRUST SECTION
          ========================================== */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        {/* Emerald-tinted background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                <Lock className="h-4 w-4" />
                Trust-First Design
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                Anti-surveillance
                <br />
                by design.
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                OnSite tracks outcomes, not keystrokes. We believe transparency
                builds better teams than surveillance ever could.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: Eye,
                    title: "Full Data Transparency",
                    desc: "Employees see exactly what's collected about them — every data point, every log.",
                  },
                  {
                    icon: Shield,
                    title: "No Screenshots or Keylogging",
                    desc: "Never built. Never will be. Not a feature we turned off — it was never a feature.",
                  },
                  {
                    icon: Brain,
                    title: "Outcome-Based Tracking",
                    desc: "Were they on-site? Did they meet their hours? That's what matters.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Data transparency card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Data Transparency Portal</p>
                    <p className="text-xs text-muted-foreground">
                      What employees see about themselves
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "Clock-in/out times and locations",
                    "GPS coordinates at clock events",
                    "Compliance status and history",
                    "Break and lunch records",
                    "All corrections and approvals",
                    "Photo verification images",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6">
                  Every piece of data collected is visible to the employee it
                  belongs to.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==========================================
          6. REVIEW PLATFORM BADGES
          ========================================== */}
      <section className="py-16 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h3 className="text-2xl font-bold tracking-tight">
              Rated highly across every platform
            </h3>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reviewPlatforms.map((platform, i) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-5 text-center"
              >
                <p className="text-lg font-bold mb-1">{platform.name}</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-2xl font-bold mb-0.5">{platform.rating}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {platform.reviews} reviews
                </p>
                <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                  {platform.badge}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          7. TESTIMONIALS
          ========================================== */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Trusted by teams everywhere.
            </h2>
            <p className="text-xl text-muted-foreground">
              See what operations leaders are saying about OnSite.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          8. HOW IT WORKS (3 STEPS)
          ========================================== */}
      <section id="how-it-works" className="py-24 sm:py-32 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Up and running in minutes.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No hardware. No IT department. No contracts. Just create, invite,
              and track.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create your org",
                desc: "Sign up and name your team. Default work locations are added automatically.",
                icon: Users,
              },
              {
                step: "2",
                title: "Invite your team",
                desc: "Share an 8-character code. New members join instantly — no admin approval needed.",
                icon: MapPin,
              },
              {
                step: "3",
                title: "Start tracking",
                desc: "Configure required days and let OnSite handle compliance monitoring automatically.",
                icon: Clock,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {/* Connecting dashed line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
                <div className="relative rounded-2xl border border-border/50 bg-card p-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          9. PRICING PREVIEW
          ========================================== */}
      <section id="pricing" className="py-24 sm:py-32 bg-muted/30 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-background text-sm font-medium mb-6">
              <Trophy className="h-4 w-4 text-primary" />
              Simple Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Start free, scale as you grow.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. No per-location charges. Just straightforward
              pricing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "rounded-2xl p-6 sm:p-8 relative",
                  tier.highlighted
                    ? "card-highlight scale-[1.02] shadow-xl"
                    : "border border-border/50 bg-card"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period && (
                      <span className="text-muted-foreground">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0 mt-0.5",
                          tier.highlighted ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="block">
                  <Button
                    variant={tier.highlighted ? "gradient" : "outline"}
                    className="w-full rounded-xl"
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          10. FINAL CTA + FOOTER
          ========================================== */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-gradient rounded-3xl px-8 py-16 sm:px-16 sm:py-20 text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
              Ready to know who&apos;s on-site?
            </h2>
            <p className="text-xl text-white/70 max-w-xl mx-auto mb-10">
              Stop guessing. Start tracking. Your team could be clocking in
              within minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="xl"
                  className="bg-white text-gray-900 hover:bg-white/90 gap-2 shadow-2xl font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="xl"
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/10"
              >
                Book a Demo
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Time Tracking", "Compliance", "Payroll", "Analytics", "Gamification"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#features"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {["Documentation", "API Reference", "Help Center", "Status"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Security", "GDPR"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} OnSite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
