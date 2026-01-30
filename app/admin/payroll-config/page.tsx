"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { BottomNav } from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  DollarSign,
  Settings,
  Clock,
  Calculator,
  Save,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react"

interface PayrollMapping {
  provider: string
  payCodes: {
    regular: string
    overtime: string
    callout: string
  }
  breakDeduction: boolean
  roundingRule: string
  roundingIncrement: number
}

interface PayrollTotals {
  regularMinutes: number
  overtimeMinutes: number
  calloutMinutes: number
  totalMinutes: number
}

interface PayrollPreview {
  period: string
  totals: PayrollTotals
}

const PROVIDERS = ["CSV", "Gusto", "ADP", "Paychex", "QuickBooks"]
const ROUNDING_RULES = ["None", "Up", "Down", "Nearest"]
const ROUNDING_INCREMENTS = [1, 5, 6, 10, 15, 30]

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const fmtDecimal = (mins: number) => (mins / 60).toFixed(2)
const fmtH = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />
}

export default function PayrollConfigPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [mapping, setMapping] = useState<PayrollMapping>({
    provider: "CSV",
    payCodes: { regular: "REG", overtime: "OT", callout: "CO" },
    breakDeduction: false,
    roundingRule: "None",
    roundingIncrement: 15,
  })
  const [preview, setPreview] = useState<PayrollPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const fetchMapping = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll/mapping")
      if (res.ok) {
        const data = await res.json()
        setMapping({
          provider: data.provider || "CSV",
          payCodes: {
            regular: data.regularPayCode || "REG",
            overtime: data.overtimePayCode || "OT",
            callout: data.calloutPayCode || "CALL",
          },
          breakDeduction: data.breakDeductionEnabled ?? false,
          roundingRule: data.roundingRule || "None",
          roundingIncrement: data.roundingIncrement ?? 15,
        })
      }
    } catch (err) {
      console.error("Error fetching payroll mapping:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const month = format(new Date(), "yyyy-MM")
      const res = await fetch(`/api/payroll?month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setPreview({ period: data.period, totals: data.totals })
      }
    } catch (err) {
      console.error("Error fetching payroll preview:", err)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/")
      return
    }
    if (!authLoading && isAdmin) {
      fetchMapping()
      fetchPreview()
    }
  }, [authLoading, isAdmin, router, fetchMapping, fetchPreview])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/payroll/mapping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: mapping.provider,
          regularPayCode: mapping.payCodes.regular,
          overtimePayCode: mapping.payCodes.overtime,
          calloutPayCode: mapping.payCodes.callout,
          breakDeductionEnabled: mapping.breakDeduction,
          roundingRule: mapping.roundingRule,
          roundingIncrement: mapping.roundingIncrement,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save configuration")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      fetchPreview()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass border-b lg:ml-64">
          <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Payroll Config</h1>
            </div>
            <h1 className="hidden lg:block text-xl font-semibold">
              Payroll Configuration
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 pb-24 lg:pb-8 lg:ml-64">
          <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </main>
        <BottomNav currentPath="/admin" />
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-background"
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Payroll Config</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">
            Payroll Export Configuration
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Provider Selection */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payroll Provider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider" className="text-sm">
                    Export Format
                  </Label>
                  <Select
                    value={mapping.provider}
                    onValueChange={(val) =>
                      setMapping((prev) => ({ ...prev, provider: val }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pay Codes */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Pay Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Map your internal pay codes to the exported timesheet columns.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payCodeRegular" className="text-sm">
                      Regular
                    </Label>
                    <Input
                      id="payCodeRegular"
                      value={mapping.payCodes.regular}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          payCodes: { ...prev.payCodes, regular: e.target.value },
                        }))
                      }
                      placeholder="REG"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payCodeOvertime" className="text-sm">
                      Overtime
                    </Label>
                    <Input
                      id="payCodeOvertime"
                      value={mapping.payCodes.overtime}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          payCodes: { ...prev.payCodes, overtime: e.target.value },
                        }))
                      }
                      placeholder="OT"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payCodeCallout" className="text-sm">
                      Callout
                    </Label>
                    <Input
                      id="payCodeCallout"
                      value={mapping.payCodes.callout}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          payCodes: { ...prev.payCodes, callout: e.target.value },
                        }))
                      }
                      placeholder="CO"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Break Deduction & Rounding */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Rounding & Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Break Deduction Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="breakDeduction">Break Deduction</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically deduct unpaid break time
                    </p>
                  </div>
                  <Switch
                    id="breakDeduction"
                    checked={mapping.breakDeduction}
                    onCheckedChange={(checked) =>
                      setMapping((prev) => ({ ...prev, breakDeduction: checked }))
                    }
                  />
                </div>

                {/* Rounding Rule */}
                <div className="space-y-2">
                  <Label htmlFor="roundingRule" className="text-sm">
                    Rounding Rule
                  </Label>
                  <Select
                    value={mapping.roundingRule}
                    onValueChange={(val) =>
                      setMapping((prev) => ({ ...prev, roundingRule: val }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select rounding rule" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUNDING_RULES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rounding Increment */}
                <div className="space-y-2">
                  <Label htmlFor="roundingIncrement" className="text-sm">
                    Rounding Increment
                  </Label>
                  <Select
                    value={String(mapping.roundingIncrement)}
                    onValueChange={(val) =>
                      setMapping((prev) => ({
                        ...prev,
                        roundingIncrement: parseInt(val),
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select increment" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUNDING_INCREMENTS.map((inc) => (
                        <SelectItem key={inc} value={String(inc)}>
                          {inc} minute{inc !== 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div variants={staggerItem}>
            <Button
              className="w-full rounded-xl h-12 gap-2 text-base"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-5 w-5" />
                  Configuration Saved
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Configuration
                </>
              )}
            </Button>
          </motion.div>

          {/* Payroll Preview */}
          <motion.div variants={staggerItem}>
            <Card className="border-0 shadow-xl bg-primary/5 ring-1 ring-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payroll Preview
                  {preview && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {preview.period}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : preview ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-background/60 rounded-xl p-3 text-center">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {mapping.payCodes.regular}
                        </Badge>
                        <p className="text-xl font-bold tabular-nums">
                          {fmtDecimal(preview.totals.regularMinutes)}h
                        </p>
                        <p className="text-xs text-muted-foreground">Regular</p>
                      </div>
                      <div className="bg-background/60 rounded-xl p-3 text-center">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {mapping.payCodes.overtime}
                        </Badge>
                        <p className="text-xl font-bold tabular-nums text-amber-500">
                          {fmtDecimal(preview.totals.overtimeMinutes)}h
                        </p>
                        <p className="text-xs text-muted-foreground">Overtime</p>
                      </div>
                      <div className="bg-background/60 rounded-xl p-3 text-center">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {mapping.payCodes.callout}
                        </Badge>
                        <p className="text-xl font-bold tabular-nums text-blue-500">
                          {fmtDecimal(preview.totals.calloutMinutes)}h
                        </p>
                        <p className="text-xs text-muted-foreground">Callout</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/60 rounded-xl">
                      <div>
                        <p className="text-sm text-muted-foreground">Grand Total</p>
                        <p className="text-2xl font-bold">
                          {fmtH(preview.totals.totalMinutes)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Decimal</p>
                        <p className="text-2xl font-bold tabular-nums">
                          {fmtDecimal(preview.totals.totalMinutes)}h
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Preview based on current month data with configured pay codes
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No payroll data available for the current month.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>

      <BottomNav currentPath="/admin" />
    </motion.div>
  )
}
