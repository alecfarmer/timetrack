"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Scale,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Plus,
  Pencil,
  X,
  Save,
  AlertCircle,
  Globe,
  Coffee,
  CalendarClock,
} from "lucide-react"

interface JurisdictionPolicy {
  id: string
  jurisdictionCode: string
  name: string
  requiredDaysPerWeek: number
  overtimeDailyMinutes: number
  overtimeWeeklyMinutes: number
  mealBreakRequired: boolean
  mealBreakAfterMinutes: number
  mealBreakDurationMinutes: number
  restBreakRequired: boolean
  restBreakIntervalMinutes: number
  restBreakDurationMinutes: number
  predictiveScheduling: boolean
  advanceNoticeHours: number
  clopeningMinHours: number
  active: boolean
}

interface JurisdictionFormData {
  jurisdictionCode: string
  name: string
  requiredDaysPerWeek: number
  overtimeDailyMinutes: number
  overtimeWeeklyMinutes: number
  mealBreakRequired: boolean
  mealBreakAfterMinutes: number
  mealBreakDurationMinutes: number
  restBreakRequired: boolean
  restBreakIntervalMinutes: number
  restBreakDurationMinutes: number
  predictiveScheduling: boolean
  advanceNoticeHours: number
  clopeningMinHours: number
}

const KNOWN_JURISDICTIONS = [
  { code: "US-CA", label: "California, US", defaults: { overtimeDailyMinutes: 480, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 300, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 240, restBreakDurationMinutes: 10 } },
  { code: "US-NY", label: "New York, US", defaults: { overtimeDailyMinutes: 0, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 360, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 0, restBreakDurationMinutes: 0 } },
  { code: "US-OR", label: "Oregon, US", defaults: { overtimeDailyMinutes: 0, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 360, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 240, restBreakDurationMinutes: 10 } },
  { code: "US-WA", label: "Washington, US", defaults: { overtimeDailyMinutes: 0, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 300, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 240, restBreakDurationMinutes: 10 } },
  { code: "US-IL", label: "Illinois, US", defaults: { overtimeDailyMinutes: 0, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 450, mealBreakDurationMinutes: 20, restBreakIntervalMinutes: 0, restBreakDurationMinutes: 0 } },
  { code: "US-CO", label: "Colorado, US", defaults: { overtimeDailyMinutes: 720, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 300, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 240, restBreakDurationMinutes: 10 } },
  { code: "UK", label: "United Kingdom", defaults: { overtimeDailyMinutes: 0, overtimeWeeklyMinutes: 2880, mealBreakAfterMinutes: 360, mealBreakDurationMinutes: 20, restBreakIntervalMinutes: 0, restBreakDurationMinutes: 0 } },
  { code: "AU", label: "Australia", defaults: { overtimeDailyMinutes: 456, overtimeWeeklyMinutes: 2280, mealBreakAfterMinutes: 300, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 0, restBreakDurationMinutes: 0 } },
  { code: "EU-DE", label: "Germany, EU", defaults: { overtimeDailyMinutes: 480, overtimeWeeklyMinutes: 2400, mealBreakAfterMinutes: 360, mealBreakDurationMinutes: 30, restBreakIntervalMinutes: 540, restBreakDurationMinutes: 15 } },
  { code: "EU-FR", label: "France, EU", defaults: { overtimeDailyMinutes: 600, overtimeWeeklyMinutes: 2100, mealBreakAfterMinutes: 360, mealBreakDurationMinutes: 20, restBreakIntervalMinutes: 0, restBreakDurationMinutes: 0 } },
]

const defaultFormData: JurisdictionFormData = {
  jurisdictionCode: "",
  name: "",
  requiredDaysPerWeek: 5,
  overtimeDailyMinutes: 480,
  overtimeWeeklyMinutes: 2400,
  mealBreakRequired: true,
  mealBreakAfterMinutes: 300,
  mealBreakDurationMinutes: 30,
  restBreakRequired: false,
  restBreakIntervalMinutes: 240,
  restBreakDurationMinutes: 10,
  predictiveScheduling: false,
  advanceNoticeHours: 0,
  clopeningMinHours: 0,
}

export default function JurisdictionsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [policies, setPolicies] = useState<JurisdictionPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<JurisdictionFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)

  const fetchPolicies = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/org/policy/jurisdictions")
      if (res.ok) {
        setPolicies(await res.json())
      } else {
        setError("Failed to load jurisdiction policies")
      }
    } catch {
      setError("Failed to load jurisdiction policies")
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
      fetchPolicies()
    }
  }, [authLoading, isAdmin, router, fetchPolicies])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPolicies()
    setRefreshing(false)
  }

  const handleJurisdictionSelect = (code: string) => {
    const known = KNOWN_JURISDICTIONS.find((j) => j.code === code)
    if (known) {
      setFormData((prev) => ({
        ...prev,
        jurisdictionCode: code,
        name: known.label,
        overtimeDailyMinutes: known.defaults.overtimeDailyMinutes,
        overtimeWeeklyMinutes: known.defaults.overtimeWeeklyMinutes,
        mealBreakAfterMinutes: known.defaults.mealBreakAfterMinutes,
        mealBreakDurationMinutes: known.defaults.mealBreakDurationMinutes,
        mealBreakRequired: known.defaults.mealBreakAfterMinutes > 0,
        restBreakIntervalMinutes: known.defaults.restBreakIntervalMinutes,
        restBreakDurationMinutes: known.defaults.restBreakDurationMinutes,
        restBreakRequired: known.defaults.restBreakIntervalMinutes > 0,
      }))
    }
  }

  const handleEditPolicy = (policy: JurisdictionPolicy) => {
    setEditingId(policy.id)
    setFormData({
      jurisdictionCode: policy.jurisdictionCode,
      name: policy.name,
      requiredDaysPerWeek: policy.requiredDaysPerWeek,
      overtimeDailyMinutes: policy.overtimeDailyMinutes,
      overtimeWeeklyMinutes: policy.overtimeWeeklyMinutes,
      mealBreakRequired: policy.mealBreakRequired,
      mealBreakAfterMinutes: policy.mealBreakAfterMinutes,
      mealBreakDurationMinutes: policy.mealBreakDurationMinutes,
      restBreakRequired: policy.restBreakRequired,
      restBreakIntervalMinutes: policy.restBreakIntervalMinutes,
      restBreakDurationMinutes: policy.restBreakDurationMinutes,
      predictiveScheduling: policy.predictiveScheduling,
      advanceNoticeHours: policy.advanceNoticeHours,
      clopeningMinHours: policy.clopeningMinHours,
    })
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(defaultFormData)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const url = "/api/org/policy/jurisdictions"
      const method = editingId ? "PATCH" : "POST"
      const body = editingId
        ? { id: editingId, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save policy")
      }

      handleCancelForm()
      await fetchPolicies()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save policy")
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof JurisdictionFormData>(
    key: K,
    value: JurisdictionFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const configuredCodes = policies.map((p) => p.jurisdictionCode)
  const activePolicies = policies.filter((p) => p.active)
  const policiesWithBreaks = policies.filter((p) => p.mealBreakRequired || p.restBreakRequired)
  const policiesWithScheduling = policies.filter((p) => p.predictiveScheduling)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading jurisdictions...</p>
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
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
          <div className="flex items-center justify-between px-4 h-14 max-w-6xl mx-auto lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Jurisdiction Policies</h1>
                <p className="text-xs text-white/60">Multi-region labor law compliance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!showForm && (
                <Button
                  size="sm"
                  className="rounded-xl gap-2 bg-white/10 hover:bg-white/20 text-white border-white/10"
                  onClick={() => {
                    setEditingId(null)
                    setFormData(defaultFormData)
                    setShowForm(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Jurisdiction</span>
                </Button>
              )}
              <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} className="text-white/70 hover:text-white hover:bg-white/10" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Stats Cards in Hero */}
        <div className="relative z-10 px-4 pt-4 pb-6 max-w-6xl mx-auto lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{policies.length}</p>
              <p className="text-xs text-white/60">Total Policies</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{activePolicies.length}</p>
              <p className="text-xs text-white/60">Active</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                <Coffee className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400">{policiesWithBreaks.length}</p>
              <p className="text-xs text-white/60">With Breaks</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-2">
                <CalendarClock className="h-5 w-5 text-teal-400" />
              </div>
              <p className="text-2xl font-bold text-teal-400">{policiesWithScheduling.length}</p>
              <p className="text-xs text-white/60">Predictive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8 -mt-4">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {editingId ? "Edit Jurisdiction Policy" : "Add Jurisdiction Policy"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCancelForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                      <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                      <TabsTrigger value="overtime" className="text-xs">Overtime</TabsTrigger>
                      <TabsTrigger value="breaks" className="text-xs">Breaks</TabsTrigger>
                      <TabsTrigger value="scheduling" className="text-xs">Scheduling</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Jurisdiction</Label>
                          <Select
                            value={formData.jurisdictionCode}
                            onValueChange={handleJurisdictionSelect}
                            disabled={!!editingId}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select jurisdiction" />
                            </SelectTrigger>
                            <SelectContent>
                              {KNOWN_JURISDICTIONS.map((j) => (
                                <SelectItem
                                  key={j.code}
                                  value={j.code}
                                  disabled={!editingId && configuredCodes.includes(j.code)}
                                >
                                  <span className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {j.label}
                                    {configuredCodes.includes(j.code) && !editingId && (
                                      <span className="text-muted-foreground">(configured)</span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Policy Name</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            placeholder="e.g. California Standard"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Required Days / Week</Label>
                        <Input
                          type="number"
                          min={0}
                          max={7}
                          value={formData.requiredDaysPerWeek}
                          onChange={(e) => updateField("requiredDaysPerWeek", parseInt(e.target.value) || 0)}
                          className="rounded-xl w-32"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="overtime" className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Daily OT Threshold (minutes)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={formData.overtimeDailyMinutes}
                            onChange={(e) => updateField("overtimeDailyMinutes", parseInt(e.target.value) || 0)}
                            className="rounded-xl"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            0 = no daily OT threshold. {formData.overtimeDailyMinutes > 0 && `(${(formData.overtimeDailyMinutes / 60).toFixed(1)}h)`}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Weekly OT Threshold (minutes)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={formData.overtimeWeeklyMinutes}
                            onChange={(e) => updateField("overtimeWeeklyMinutes", parseInt(e.target.value) || 0)}
                            className="rounded-xl"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            {formData.overtimeWeeklyMinutes > 0 && `(${(formData.overtimeWeeklyMinutes / 60).toFixed(1)}h)`}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="breaks" className="space-y-6">
                      {/* Meal Break */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Meal Break</Label>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Required</Label>
                            <Switch
                              checked={formData.mealBreakRequired}
                              onCheckedChange={(val) => updateField("mealBreakRequired", val)}
                            />
                          </div>
                        </div>
                        {formData.mealBreakRequired && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="grid sm:grid-cols-2 gap-4"
                          >
                            <div className="space-y-2">
                              <Label className="text-xs">After (minutes)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={formData.mealBreakAfterMinutes}
                                onChange={(e) => updateField("mealBreakAfterMinutes", parseInt(e.target.value) || 0)}
                                className="rounded-xl"
                              />
                              <p className="text-[10px] text-muted-foreground">
                                {formData.mealBreakAfterMinutes > 0 && `(${(formData.mealBreakAfterMinutes / 60).toFixed(1)}h)`}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Duration (minutes)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={formData.mealBreakDurationMinutes}
                                onChange={(e) => updateField("mealBreakDurationMinutes", parseInt(e.target.value) || 0)}
                                className="rounded-xl"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Rest Break */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Rest Break</Label>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Required</Label>
                            <Switch
                              checked={formData.restBreakRequired}
                              onCheckedChange={(val) => updateField("restBreakRequired", val)}
                            />
                          </div>
                        </div>
                        {formData.restBreakRequired && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="grid sm:grid-cols-2 gap-4"
                          >
                            <div className="space-y-2">
                              <Label className="text-xs">Interval (minutes)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={formData.restBreakIntervalMinutes}
                                onChange={(e) => updateField("restBreakIntervalMinutes", parseInt(e.target.value) || 0)}
                                className="rounded-xl"
                              />
                              <p className="text-[10px] text-muted-foreground">
                                {formData.restBreakIntervalMinutes > 0 && `(every ${(formData.restBreakIntervalMinutes / 60).toFixed(1)}h)`}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Duration (minutes)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={formData.restBreakDurationMinutes}
                                onChange={(e) => updateField("restBreakDurationMinutes", parseInt(e.target.value) || 0)}
                                className="rounded-xl"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="scheduling" className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div>
                          <Label className="text-sm font-medium">Predictive Scheduling</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Require advance notice for schedule changes
                          </p>
                        </div>
                        <Switch
                          checked={formData.predictiveScheduling}
                          onCheckedChange={(val) => updateField("predictiveScheduling", val)}
                        />
                      </div>
                      {formData.predictiveScheduling && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="grid sm:grid-cols-2 gap-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-xs">Advance Notice (hours)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.advanceNoticeHours}
                              onChange={(e) => updateField("advanceNoticeHours", parseInt(e.target.value) || 0)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Clopening Minimum (hours)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.clopeningMinHours}
                              onChange={(e) => updateField("clopeningMinHours", parseInt(e.target.value) || 0)}
                              className="rounded-xl"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Minimum hours between closing and opening shifts
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button
                      className="flex-1 rounded-xl gap-2"
                      onClick={handleSave}
                      disabled={saving || !formData.jurisdictionCode || !formData.name}
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={handleCancelForm}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Known Jurisdictions Overview */}
          {!showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Available Jurisdictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {KNOWN_JURISDICTIONS.map((j) => {
                      const isConfigured = configuredCodes.includes(j.code)
                      return (
                        <div
                          key={j.code}
                          className={`p-3 rounded-xl text-center text-xs transition-colors ${
                            isConfigured
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-muted/50"
                          }`}
                        >
                          <p className="font-medium">{j.code}</p>
                          <p className="text-muted-foreground mt-0.5">{j.label}</p>
                          {isConfigured && (
                            <Badge variant="default" className="mt-1 text-[10px]">
                              Active
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Configured Policies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Configured Policies
              </h2>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                {policies.length} {policies.length === 1 ? "policy" : "policies"}
              </Badge>
            </div>

            {loading ? (
              <div className="grid lg:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-6 animate-pulse space-y-3">
                      <div className="h-5 w-32 bg-muted rounded" />
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-4 w-40 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : policies.length === 0 ? (
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No jurisdiction policies configured yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a policy to enforce jurisdiction-specific labor rules.
                  </p>
                  <Button
                    className="mt-4 rounded-xl gap-2"
                    size="sm"
                    onClick={() => {
                      setEditingId(null)
                      setFormData(defaultFormData)
                      setShowForm(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Jurisdiction Policy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {policies.map((policy, index) => (
                  <motion.div
                    key={policy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className="border-0 shadow-lg rounded-2xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Scale className="h-4 w-4 text-primary" />
                            {policy.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={policy.active ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {policy.active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditPolicy(policy)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{policy.jurisdictionCode}</span>
                          <span className="mx-1">|</span>
                          <span>{policy.requiredDaysPerWeek} days/week</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overtime</p>
                            <p className="text-xs font-medium mt-0.5">
                              {policy.overtimeDailyMinutes > 0 ? `${(policy.overtimeDailyMinutes / 60).toFixed(1)}h daily` : "No daily limit"}
                            </p>
                            <p className="text-xs font-medium">
                              {(policy.overtimeWeeklyMinutes / 60).toFixed(1)}h weekly
                            </p>
                          </div>
                          <div className="p-2.5 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meal Break</p>
                            <p className="text-xs font-medium mt-0.5">
                              {policy.mealBreakRequired
                                ? `${policy.mealBreakDurationMinutes}min after ${(policy.mealBreakAfterMinutes / 60).toFixed(1)}h`
                                : "Not required"}
                            </p>
                          </div>
                          <div className="p-2.5 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rest Break</p>
                            <p className="text-xs font-medium mt-0.5">
                              {policy.restBreakRequired
                                ? `${policy.restBreakDurationMinutes}min every ${(policy.restBreakIntervalMinutes / 60).toFixed(1)}h`
                                : "Not required"}
                            </p>
                          </div>
                          <div className="p-2.5 bg-muted/50 rounded-lg">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Scheduling</p>
                            <p className="text-xs font-medium mt-0.5">
                              {policy.predictiveScheduling
                                ? `${policy.advanceNoticeHours}h notice`
                                : "Standard"}
                            </p>
                            {policy.predictiveScheduling && policy.clopeningMinHours > 0 && (
                              <p className="text-xs font-medium">
                                {policy.clopeningMinHours}h clopening min
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}
