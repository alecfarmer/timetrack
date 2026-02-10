"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
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
  Shield,
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

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function FeaturesPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [features, setFeatures] = useState<Features | null>(null)
  const [loading, setLoading] = useState(true)
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading features...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col min-h-screen bg-background" initial="initial" animate="animate" variants={pageVariants}>
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Feature Management</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <motion.main className="flex-1 pb-24 lg:pb-8" variants={staggerContainer} initial="initial" animate="animate">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          <motion.div variants={staggerItem}>
            <p className="text-sm text-muted-foreground">
              Enable or disable features for your organization. Changes take effect immediately for all team members.
            </p>
          </motion.div>

          <div className="space-y-3">
            {features && (Object.keys(FEATURE_META) as (keyof Features)[]).map((key) => {
              const meta = FEATURE_META[key]
              const Icon = meta.icon
              const enabled = features[key]

              return (
                <motion.div key={key} variants={staggerItem}>
                  <Card className={`border-0 shadow-lg transition-all ${enabled ? "" : "opacity-70"}`}>
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
      </motion.main>
    </motion.div>
  )
}
