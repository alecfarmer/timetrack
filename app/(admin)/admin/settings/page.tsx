"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Settings,
  Sliders,
  Scale,
  Palmtree,
  DollarSign,
  Bell,
  Building2,
  ChevronRight,
  ShieldCheck,
  Globe,
  Clock,
} from "lucide-react"

interface OrgInfo {
  orgId: string
  orgName: string
  timezone?: string
}

interface FeatureStatus {
  enabled: number
  total: number
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const SETTINGS_SECTIONS = [
  {
    title: "General",
    description: "Organization name, timezone, and branding",
    href: "/admin/settings/general",
    icon: Building2,
    color: "text-slate-500 bg-slate-500/10",
    badge: null,
  },
  {
    title: "Features",
    description: "Enable or disable app features for your organization",
    href: "/admin/features",
    icon: Sliders,
    color: "text-violet-500 bg-violet-500/10",
    badge: "features",
  },
  {
    title: "Work Policies",
    description: "Set required days, hours, and work rules",
    href: "/admin/jurisdictions",
    icon: Scale,
    color: "text-cyan-500 bg-cyan-500/10",
    badge: null,
  },
  {
    title: "Leave & PTO",
    description: "Configure annual allowances, carryover, and leave types",
    href: "/admin/leave-policy",
    icon: Palmtree,
    color: "text-teal-500 bg-teal-500/10",
    badge: null,
  },
  {
    title: "Payroll Export",
    description: "Set up payroll integrations and export formats",
    href: "/admin/payroll-config",
    icon: DollarSign,
    color: "text-green-500 bg-green-500/10",
    badge: null,
  },
  {
    title: "Alerts & Notifications",
    description: "Configure when and how alerts are sent",
    href: "/admin/alerts",
    icon: Bell,
    color: "text-orange-500 bg-orange-500/10",
    badge: null,
  },
]

export default function SettingsPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!org) return

    setOrgInfo({
      orgId: org.orgId,
      orgName: org.orgName || "My Organization",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })

    try {
      const res = await fetch("/api/org/features")
      if (res.ok) {
        const features = await res.json()
        const entries = Object.entries(features)
        const enabled = entries.filter(([, v]) => v === true).length
        setFeatureStatus({ enabled, total: entries.length })
      }
    } catch {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }, [org])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/app")
      return
    }

    if (!authLoading && isAdmin && org) {
      fetchData()
    }
  }, [authLoading, isAdmin, org, router, fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Premium Dark Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <header className="relative z-10 safe-area-pt">
          <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Settings</h1>
                {org && (
                  <p className="text-xs text-white/60">{org.orgName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Organization Overview in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-8 max-w-4xl mx-auto lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{orgInfo?.orgName}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {orgInfo?.timezone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {featureStatus ? `${featureStatus.enabled}/${featureStatus.total} features active` : "Loading..."}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <motion.main
        className="flex-1 pb-8 -mt-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-6">
          {/* Settings Sections */}
          <motion.div variants={staggerItem}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Configuration
            </h3>
            <div className="grid gap-3">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <motion.div key={section.href} variants={staggerItem}>
                    <Link href={section.href}>
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${section.color}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{section.title}</h4>
                                {section.badge === "features" && featureStatus && (
                                  <Badge variant="secondary" className="text-xs">
                                    {featureStatus.enabled} active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {section.description}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Quick Tip */}
          <motion.div variants={staggerItem}>
            <Card className="border-dashed rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tip: Feature Flags</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You can enable or disable features like photo verification, break tracking, and manual corrections from the Features page. Changes take effect immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>
    </motion.div>
  )
}
