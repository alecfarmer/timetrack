"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useOrgRouter } from "@/components/org-link"
import {
  Camera,
  Coffee,
  ClipboardCheck,
  Bell,
  BarChart3,
  Pencil,
  ScrollText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sliders,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

interface Features {
  photoVerification: boolean
  breakTracking: boolean
  timesheetApproval: boolean
  alerts: boolean
  analytics: boolean
  manualCorrections: boolean
  auditLog: boolean
}

const FEATURE_META: Record<keyof Features, { icon: typeof Camera; label: string; description: string; tier: string }> = {
  photoVerification: {
    icon: Camera,
    label: "Photo Verification",
    description: "Require a selfie on clock-in to prevent buddy punching. Photos are stored with each entry.",
    tier: "Premium",
  },
  breakTracking: {
    icon: Coffee,
    label: "Break / Lunch Tracking",
    description: "Track break start/end times. Configure required break minutes and auto-deduct from hours.",
    tier: "Premium",
  },
  timesheetApproval: {
    icon: ClipboardCheck,
    label: "Timesheet Approval",
    description: "Members submit weekly timesheets for manager review. Admins approve or reject before payroll.",
    tier: "Enterprise",
  },
  alerts: {
    icon: Bell,
    label: "Smart Alerts",
    description: "Get notified about late arrivals, missed clock-outs, and approaching overtime thresholds.",
    tier: "Standard",
  },
  analytics: {
    icon: BarChart3,
    label: "Team Analytics",
    description: "Trends, compliance rates, location usage, and member insights over time.",
    tier: "Standard",
  },
  manualCorrections: {
    icon: Pencil,
    label: "Entry Corrections",
    description: "Allow users and admins to edit past clock entries with a required reason and full audit trail.",
    tier: "Standard",
  },
  auditLog: {
    icon: ScrollText,
    label: "Audit Log",
    description: "Track every change — role updates, policy edits, member removals, entry corrections.",
    tier: "Standard",
  },
}

export default function FeaturesPage() {
  const { org, isAdmin, loading: authLoading } = useAuth()
  const router = useOrgRouter()
  const [features, setFeatures] = useState<Features | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/org/features")
      if (res.ok) {
        setFeatures(await res.json())
      }
    } catch {
      setError("Failed to load features")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchFeatures()
    }
  }, [authLoading, isAdmin, router, fetchFeatures])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFeatures()
    setRefreshing(false)
  }

  const handleToggle = async (key: keyof Features) => {
    if (!features) return
    setSaving(key)
    setError(null)
    try {
      const res = await fetch("/api/org/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !features[key] }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const updated = await res.json()
      setFeatures(updated)
    } catch {
      setError(`Failed to toggle ${FEATURE_META[key].label}`)
    } finally {
      setSaving(null)
    }
  }

  // Count enabled and disabled features
  const enabledCount = features ? Object.values(features).filter(Boolean).length : 0
  const disabledCount = features ? Object.values(features).filter((v) => !v).length : 0

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading features...</p>
        </motion.div>
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
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <header className="relative z-10 safe-area-pt">
          <div className="flex items-center justify-between px-4 h-14 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/admin")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Sliders className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Feature Management</h1>
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

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <ToggleRight className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{enabledCount}</p>
              <p className="text-xs text-white/60">Enabled</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center mx-auto mb-2">
                <ToggleLeft className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-400">{disabledCount}</p>
              <p className="text-xs text-white/60">Disabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 pt-6">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm text-muted-foreground">
              Enable or disable features for your organization. Changes take effect immediately for all team members.
            </p>
          </motion.div>

          <div className="space-y-3">
            {features && (Object.keys(FEATURE_META) as (keyof Features)[]).map((key, index) => {
              const meta = FEATURE_META[key]
              const Icon = meta.icon
              const enabled = features[key]

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className={`border-0 shadow-lg transition-all rounded-2xl ${enabled ? "" : "opacity-70"}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          enabled ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <Icon className={`h-5 w-5 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm">{meta.label}</h3>
                            <Badge variant="secondary" className="text-[10px]">{meta.tier}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
                        </div>
                        <div className="flex-shrink-0 pt-0.5">
                          {saving === key ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => handleToggle(key)}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
    </motion.div>
  )
}
