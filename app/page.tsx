"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Logo, LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  MapPin,
  Clock,
  Shield,
  Users,
  BarChart3,
  Wifi,
  ArrowRight,
  Check,
  Smartphone,
  Globe,
  Zap,
  ChevronRight,
  Camera,
  Coffee,
  ClipboardCheck,
  Bell,
  Brain,
  Scale,
  HeartPulse,
  Eye,
  FileCheck,
  Sparkles,
  Trophy,
  Target,
  Flame,
  Star,
  TrendingUp,
  Award,
  Play,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Lock,
  Timer,
  CalendarCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const stats = [
  { value: "50K+", label: "Clock Events Daily" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 200ms", label: "API Response" },
  { value: "SOC 2", label: "Certified" },
]

const features = [
  {
    icon: MapPin,
    title: "GPS Geofencing",
    description: "Automatic verification when employees enter work zones. No manual check-ins required.",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Live dashboards show who's on-site, working hours, and attendance patterns instantly.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Shield,
    title: "Compliance Engine",
    description: "Multi-jurisdiction labor law compliance. California, Oregon, NYC — all handled automatically.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Punctuality scores, attendance trends, and productivity insights that drive decisions.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Wifi,
    title: "Offline-First",
    description: "Clock in without internet. Entries sync automatically when connectivity returns.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Badges, XP levels, and challenges turn attendance into engagement. 24 achievements to unlock.",
    gradient: "from-amber-500 to-yellow-500",
  },
]

const enterpriseFeatures = [
  {
    icon: Scale,
    title: "Multi-Jurisdiction",
    description: "Automatically apply California meal breaks, Oregon predictive scheduling, or NYC Fair Workweek laws based on location.",
    badge: "Compliance",
  },
  {
    icon: HeartPulse,
    title: "Well-Being Signals",
    description: "Track overtime patterns and consecutive work days to surface burnout risk before it becomes turnover.",
    badge: "People",
  },
  {
    icon: Sparkles,
    title: "Smart Corrections",
    description: "AI auto-approves routine time corrections. Only edge cases need manager review.",
    badge: "AI-Powered",
  },
]

const bentoItems = [
  {
    title: "Photo Verification",
    description: "Optional selfie at clock-in for high-security sites",
    icon: Camera,
    className: "col-span-1 row-span-1",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    title: "Break Tracking",
    description: "Track breaks with policy enforcement and auto-deduction",
    icon: Coffee,
    className: "col-span-1 row-span-1",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    title: "Timesheet Approval",
    description: "Weekly submission workflow with one-click approve/reject",
    icon: ClipboardCheck,
    className: "col-span-1 row-span-1",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Smart Alerts",
    description: "Late arrivals, missed clock-outs, overtime approaching",
    icon: Bell,
    className: "col-span-1 row-span-1",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
  {
    title: "Payroll Export",
    description: "Gusto, ADP, Paychex, QuickBooks — one click",
    icon: FileCheck,
    className: "col-span-1 row-span-1",
    gradient: "from-purple-500/20 to-violet-500/20",
  },
  {
    title: "Team Analytics",
    description: "Punctuality scores and period-over-period comparisons",
    icon: TrendingUp,
    className: "col-span-1 row-span-1",
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
]

const testimonials = [
  {
    quote: "Finally, a time tracking solution that doesn't feel like surveillance. Our team actually enjoys using it.",
    author: "Sarah Chen",
    role: "VP of Operations",
    company: "TechForward Inc.",
    avatar: "SC",
  },
  {
    quote: "The compliance engine saved us from three potential labor law violations in the first month alone.",
    author: "Marcus Johnson",
    role: "HR Director",
    company: "National Retail Co.",
    avatar: "MJ",
  },
  {
    quote: "Setup took 10 minutes. Our 200+ person team was clocking in by lunch. No training needed.",
    author: "Emily Rodriguez",
    role: "COO",
    company: "FastGrow Logistics",
    avatar: "ER",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
          <div className="max-w-6xl mx-auto">
            <div className="backdrop-blur-xl bg-background/70 border border-border/50 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shadow-black/5">
              <Logo size="sm" />
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="rounded-xl text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="rounded-xl bg-foreground text-background hover:bg-foreground/90 gap-1.5 text-sm">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
          <motion.div
            className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
            }}
            animate={{
              x: [0, -40, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/50 backdrop-blur-sm text-sm font-medium">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                GPS-Verified Time & Attendance
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Know who's on-site,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                in real time.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
            >
              Replace badge swipes with GPS verification. Track attendance, ensure compliance, and run payroll — all from one platform.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/signup">
                <Button size="lg" className="rounded-2xl h-14 px-8 text-base font-medium bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-2xl shadow-foreground/20">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base font-medium gap-2 border-border/50">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Works on any device</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Product preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="relative max-w-4xl mx-auto">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl opacity-50" />

              {/* Dashboard preview card */}
              <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      app.onsite.io/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <LogoMark className="w-8 h-8 rounded-lg" />
                      <div>
                        <span className="font-semibold">Dashboard</span>
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium flex items-center gap-1 inline-flex">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          On-Site
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-bold">
                      A
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Today", value: "4h 23m", icon: Timer },
                      { label: "This Week", value: "32h 15m", icon: CalendarCheck },
                      { label: "On-Site", value: "24", icon: Users },
                      { label: "Compliance", value: "98%", icon: Shield },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl bg-muted/50 p-4 text-center">
                        <stat.icon className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Week calendar strip */}
                  <div className="flex gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                      <div
                        key={day}
                        className={cn(
                          "flex-1 rounded-xl p-3 text-center transition-colors",
                          i < 3
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-muted/50 border border-transparent"
                        )}
                      >
                        <p className="text-xs text-muted-foreground mb-1">{day}</p>
                        <p className={cn(
                          "text-sm font-semibold",
                          i < 3 ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                          {i < 3 ? "8h" : "—"}
                        </p>
                        {i < 3 && (
                          <CheckCircle2 className="h-3.5 w-3.5 mx-auto mt-1 text-emerald-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Features Grid */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/50 text-sm font-medium mb-6">
              <Layers className="h-4 w-4 text-primary" />
              Core Platform
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Everything you need,
              <br />
              nothing you don't.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete time and attendance platform that scales from 5 employees to 5,000.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:border-border transition-all hover:shadow-lg"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  feature.gradient
                )}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-background text-sm font-medium mb-6">
              <Zap className="h-4 w-4 text-primary" />
              Full Feature Set
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Built for modern teams.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From photo verification to payroll export — every tool you need in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {bentoItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "group relative rounded-2xl border border-border/50 bg-card p-6 hover:border-border transition-all hover:shadow-lg overflow-hidden",
                  item.className
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                  item.gradient
                )} />
                <div className="relative">
                  <item.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/50 text-sm font-medium mb-6">
                <Building2 className="h-4 w-4 text-primary" />
                Enterprise Ready
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                Built for complexity.
                <br />
                Designed for clarity.
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Multi-state teams, shifting regulations, growing headcount. OnSite scales with your workforce — not against it.
              </p>

              <div className="space-y-6">
                {enterpriseFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 blur-3xl opacity-50" />
              <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
                {/* Compliance dashboard mock */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Compliance Engine</p>
                    <p className="text-xs text-muted-foreground">Multi-jurisdiction coverage</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { region: "California", status: "Meal breaks enforced", color: "emerald" },
                    { region: "Oregon", status: "Predictive scheduling active", color: "purple" },
                    { region: "New York City", status: "Fair Workweek compliant", color: "violet" },
                  ].map((item) => (
                    <div key={item.region} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.color === "emerald" && "bg-emerald-500",
                        item.color === "purple" && "bg-purple-500",
                        item.color === "violet" && "bg-violet-500"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.region}</p>
                        <p className="text-xs text-muted-foreground">{item.status}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Compliance</span>
                    <span className="text-2xl font-bold text-emerald-500">100%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Data Transparency Portal</p>
                    <p className="text-xs text-muted-foreground">What employees see about themselves</p>
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
                    <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6">
                  Every piece of data collected is visible to the employee it belongs to.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
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
                OnSite tracks outcomes, not keystrokes. We believe transparency builds better teams than surveillance ever could.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: Eye,
                    title: "Full Data Transparency",
                    desc: "Employees see exactly what's collected about them.",
                  },
                  {
                    icon: Shield,
                    title: "No Screenshots or Keylogging",
                    desc: "Never built. Never will be. Not a feature we turned off.",
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
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
                <Trophy className="h-4 w-4" />
                Gamification
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                Turn attendance
                <br />
                into achievement.
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Why just track time when you can celebrate it? Badges, levels, and challenges keep your team engaged.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Award, value: "24", label: "Badges" },
                  { icon: Star, value: "10", label: "XP Levels" },
                  { icon: Target, value: "Weekly", label: "Challenges" },
                  { icon: Flame, value: "∞", label: "Streak Days" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                    <item.icon className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 blur-3xl opacity-50" />
              <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

                {/* Level display */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-lg shadow-amber-500/25">
                    <span className="text-3xl font-bold">7</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Level</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-xl">Star</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">4,250 XP</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">1,250 XP to Champion</p>
                  </div>
                </div>

                {/* Recent badges */}
                <div className="mb-6">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Recent Badges</p>
                  <div className="flex gap-3">
                    {[
                      { icon: "🔥", name: "On Fire", color: "border-purple-500/30 bg-purple-500/10" },
                      { icon: "🐦", name: "Early Bird", color: "border-emerald-500/30 bg-emerald-500/10" },
                      { icon: "💯", name: "Century", color: "border-violet-500/30 bg-violet-500/10" },
                      { icon: "✅", name: "Perfect", color: "border-slate-500/30 bg-slate-500/10" },
                    ].map((badge) => (
                      <div
                        key={badge.name}
                        className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border", badge.color)}
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="text-[10px] font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active challenge */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⭐</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">Perfect Week</p>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500">+50 XP</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Clock in all 5 weekdays</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-3/5 rounded-full bg-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">3/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
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
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-32">
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
              No hardware. No IT department. No contracts. Just create, invite, and track.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create your org", desc: "Sign up and name your team. Default work locations are added automatically." },
              { step: "02", title: "Invite your team", desc: "Share an 8-character code. New members join instantly — no admin approval needed." },
              { step: "03", title: "Start tracking", desc: "Configure required days and let OnSite handle compliance monitoring automatically." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="relative rounded-2xl border border-border/50 bg-card p-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-foreground to-foreground/70 flex items-center justify-center text-background text-xl font-bold mb-4">
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

      {/* Final CTA */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <LogoMark className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-background/10 p-3" />
              <h2 className="text-4xl sm:text-5xl font-bold text-background tracking-tight mb-4">
                Ready to know who's on-site?
              </h2>
              <p className="text-xl text-background/70 max-w-xl mx-auto mb-10">
                Stop guessing. Start tracking. Your team could be clocking in within minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="rounded-2xl h-14 px-8 text-base font-medium bg-background text-foreground hover:bg-background/90 gap-2 shadow-2xl">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="ghost" className="rounded-2xl h-14 px-8 text-base font-medium text-background/90 hover:text-background hover:bg-background/10">
                    Sign In
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Security</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OnSite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
