"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Palmtree,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface Policy {
  annualPtoDays: number
  maxCarryoverDays: number
  leaveYearStartMonth: number
  leaveYearStartDay: number
}

interface Override {
  id: string
  userId: string
  annualPtoDays: number
  effectiveYear: number | null
  notes: string | null
  createdAt: string
}

interface Member {
  id: string
  userId: string
  email?: string | null
  role: string
}

export default function LeavePolicyPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [policy, setPolicy] = useState<Policy>({
    annualPtoDays: 0,
    maxCarryoverDays: 0,
    leaveYearStartMonth: 1,
    leaveYearStartDay: 1,
  })
  const [overrides, setOverrides] = useState<Override[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Override form
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [overrideUserId, setOverrideUserId] = useState("")
  const [overrideDays, setOverrideDays] = useState(0)
  const [overrideYear, setOverrideYear] = useState("")
  const [overrideNotes, setOverrideNotes] = useState("")
  const [savingOverride, setSavingOverride] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [policyRes, overridesRes, membersRes] = await Promise.all([
        fetch("/api/org/policy"),
        fetch("/api/org/leave-allowances"),
        fetch("/api/org/members"),
      ])

      if (policyRes.ok) {
        const p = await policyRes.json()
        setPolicy({
          annualPtoDays: p.annualPtoDays ?? 0,
          maxCarryoverDays: p.maxCarryoverDays ?? 0,
          leaveYearStartMonth: p.leaveYearStartMonth ?? 1,
          leaveYearStartDay: p.leaveYearStartDay ?? 1,
        })
      }
      if (overridesRes.ok) {
        setOverrides(await overridesRes.json())
      }
      if (membersRes.ok) {
        setMembers(await membersRes.json())
      }
    } catch {
      setError("Failed to load data")
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
      fetchData()
    }
  }, [authLoading, isAdmin, router, fetchData])

  const handleSavePolicy = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/org/policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      })
      if (!res.ok) throw new Error("Failed to save policy")
      setSuccess("Leave policy saved")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Failed to save leave policy")
    } finally {
      setSaving(false)
    }
  }

  const handleAddOverride = async () => {
    if (!overrideUserId) return
    setSavingOverride(true)
    setError(null)
    try {
      const res = await fetch("/api/org/leave-allowances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: overrideUserId,
          annualPtoDays: overrideDays,
          effectiveYear: overrideYear ? parseInt(overrideYear) : null,
          notes: overrideNotes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save override")
      }
      setShowOverrideForm(false)
      setOverrideUserId("")
      setOverrideDays(0)
      setOverrideYear("")
      setOverrideNotes("")
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save override")
    } finally {
      setSavingOverride(false)
    }
  }

  const handleDeleteOverride = async (id: string) => {
    try {
      await fetch(`/api/org/leave-allowances?id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch {
      setError("Failed to delete override")
    }
  }

  const getMemberEmail = (userId: string) => {
    const member = members.find((m) => m.userId === userId)
    return member?.email || `${userId.slice(0, 8)}...`
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Palmtree className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
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
      <header className="sticky top-0 z-50 glass border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center lg:hidden">
                <Palmtree className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold lg:text-xl lg:font-semibold">Leave Policy</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
            </div>
          )}

          {/* Section A: Org Defaults */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Palmtree className="h-5 w-5 text-primary" />
                Organization Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Annual PTO Days</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={policy.annualPtoDays}
                    onChange={(e) => setPolicy({ ...policy, annualPtoDays: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Max Carryover Days</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={policy.maxCarryoverDays}
                    onChange={(e) => setPolicy({ ...policy, maxCarryoverDays: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Leave Year Start Month</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={policy.leaveYearStartMonth}
                    onChange={(e) => setPolicy({ ...policy, leaveYearStartMonth: parseInt(e.target.value) || 1 })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Leave Year Start Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={policy.leaveYearStartDay}
                    onChange={(e) => setPolicy({ ...policy, leaveYearStartDay: parseInt(e.target.value) || 1 })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button onClick={handleSavePolicy} disabled={saving} className="rounded-xl gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Defaults"}
              </Button>
            </CardContent>
          </Card>

          {/* Section B: Per-Employee Overrides */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Per-Employee Overrides
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowOverrideForm(!showOverrideForm)}
                  className="rounded-xl gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Override
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showOverrideForm && (
                <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-sm">Employee</Label>
                    <select
                      value={overrideUserId}
                      onChange={(e) => setOverrideUserId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select member...</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.email || m.userId.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Annual PTO Days</Label>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        value={overrideDays}
                        onChange={(e) => setOverrideDays(parseInt(e.target.value) || 0)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Year (blank = permanent)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 2026"
                        value={overrideYear}
                        onChange={(e) => setOverrideYear(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Notes</Label>
                    <Input
                      placeholder="Reason for override..."
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddOverride}
                      disabled={!overrideUserId || savingOverride}
                      className="rounded-xl gap-2"
                    >
                      {savingOverride ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {savingOverride ? "Saving..." : "Save Override"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowOverrideForm(false)} className="rounded-xl">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {overrides.length > 0 ? (
                <div className="space-y-2">
                  {overrides.map((override) => (
                    <div
                      key={override.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{getMemberEmail(override.userId)}</p>
                        <p className="text-xs text-muted-foreground">
                          {override.annualPtoDays} days
                          {override.effectiveYear ? ` (${override.effectiveYear} only)` : " (permanent)"}
                          {override.notes && ` — ${override.notes}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleDeleteOverride(override.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No per-employee overrides. All employees use the org defaults above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </motion.div>
  )
}
