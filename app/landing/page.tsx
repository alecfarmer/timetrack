"use client"

import { motion } from "framer-motion"
import Link from "next/link"
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
} from "lucide-react"

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const features = [
  {
    icon: MapPin,
    title: "GPS-Verified Clock In",
    description: "Employees can only clock in when physically present within the geofence radius of their assigned work location.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Live session timers, daily totals, and instant clock status. Know exactly who's on-site right now.",
  },
  {
    icon: Shield,
    title: "Compliance Monitoring",
    description: "Set required in-office days per week. Track compliance automatically with zero manual input from managers.",
  },
  {
    icon: Users,
    title: "Team Dashboard",
    description: "Admins see every team member's status, location, hours today, and weekly compliance at a glance.",
  },
  {
    icon: BarChart3,
    title: "Reports & Export",
    description: "Weekly, monthly, and payroll reports. Export CSV for any date range. Compliance summaries for the whole team.",
  },
  {
    icon: Wifi,
    title: "Works Offline",
    description: "Clock in even without internet. Entries queue locally and sync automatically when connectivity returns.",
  },
]

const highlights = [
  "No hardware to install",
  "Works on any phone or laptop",
  "Setup in under 5 minutes",
  "Invite your team with a code",
  "WFH tracking included",
  "Leave & callout management",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-xl bg-gradient-primary gap-1.5">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="h-3.5 w-3.5" />
                GPS-verified time & attendance
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Know who&apos;s on-site,{" "}
              <span className="text-gradient">in real time.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
            >
              OnSite replaces badge swipes and honor-system sign-ins with GPS-verified clock in/out.
              Set your compliance policy, invite your team, and see who&apos;s meeting their in-office requirement — automatically.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-xl bg-gradient-primary gap-2 h-13 px-8 text-base">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-xl gap-2 h-13 px-8 text-base">
                  Sign In
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Social proof strip */}
            <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Works on any device</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>No app store needed</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Enterprise-grade security</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mock UI Preview */}
      <section className="relative -mt-8 mb-16 sm:-mt-12 sm:mb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border shadow-xl bg-card overflow-hidden"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Fake dashboard header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LogoMark className="w-8 h-8 rounded-lg" />
                  <span className="font-semibold">Dashboard</span>
                  <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    On-Site
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">A</div>
                </div>
              </div>

              {/* Fake stats row */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="rounded-xl bg-muted/50 p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold tabular-nums">4h 23m</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Today</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold tabular-nums">6</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Entries</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold tabular-nums text-success">3/3</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Week</p>
                </div>
              </div>

              {/* Fake compliance bar */}
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Weekly Compliance</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success text-success-foreground font-medium">On Track</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-full rounded-full bg-success" />
                </div>
                <div className="flex gap-1 mt-2">
                  {["Mo", "Tu", "We", "Th", "Fr"].map((day, i) => (
                    <div
                      key={day}
                      className={`flex-1 h-6 rounded-md flex items-center justify-center text-[11px] font-medium ${
                        i < 3 ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to enforce on-site policy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From GPS verification to compliance reports, OnSite handles the entire attendance workflow so you don&apos;t have to.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Highlights / Checklist */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Up and running in minutes, not months.
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create your organization, invite your team with a code, and start tracking. No hardware, no IT department, no contracts.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {/* Step cards */}
              {[
                { step: "1", title: "Create your organization", desc: "Sign up and name your team. Default work locations are added automatically." },
                { step: "2", title: "Invite your team", desc: "Share an 8-character invite code. New members join instantly — no admin approval needed." },
                { step: "3", title: "Set your policy", desc: "Configure required in-office days per week. OnSite tracks compliance automatically." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start p-4 rounded-xl bg-card border">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <LogoMark className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to know who&apos;s on-site?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Stop guessing. Start tracking. Create your free account and have your team clocking in within minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-xl bg-gradient-primary gap-2 h-13 px-8 text-base">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-xl h-13 px-8 text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            GPS-verified time & attendance tracking.
          </p>
        </div>
      </footer>
    </div>
  )
}
