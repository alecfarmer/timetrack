"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Monitor,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  MapPin,
  ExternalLink,
} from "lucide-react"

interface KioskSession {
  id: string
  orgId: string
  locationId: string
  token: string
  isActive: boolean
  createdAt: string
  expiresAt: string | null
  location?: { id: string; name: string; address?: string }
}

interface OrgLocation {
  id: string
  name: string
  address?: string
}

export default function KioskSettingsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sessions, setSessions] = useState<KioskSession[]>([])
  const [locations, setLocations] = useState<OrgLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, locationsRes] = await Promise.all([
        fetch("/api/kiosk/setup"),
        fetch("/api/org/locations"),
      ])
      if (sessionsRes.ok) setSessions(await sessionsRes.json())
      if (locationsRes.ok) setLocations(await locationsRes.json())
    } catch {
      // handle silently
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleCreate = async () => {
    if (!selectedLocation) return
    setCreating(true)
    try {
      const res = await fetch("/api/kiosk/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: selectedLocation }),
      })
      if (res.ok) {
        setShowCreate(false)
        setSelectedLocation("")
        await fetchData()
      }
    } catch {
      // handle silently
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await fetch(`/api/kiosk/setup?id=${id}`, { method: "DELETE" })
      await fetchData()
    } catch {
      // handle silently
    }
  }

  const getKioskUrl = (token: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : ""
    return `${base}/kiosk?token=${token}`
  }

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading kiosk settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background">
      <PageHeader
        title="Kiosk Mode"
        subtitle="Set up tablet clock-in stations"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Kiosk
            </Button>
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
          </div>
        }
      />

      <div className="max-w-4xl mx-auto w-full px-4 lg:px-8 pt-4 pb-24 lg:pb-8 space-y-4">
        {/* Create Form */}
        {showCreate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Create Kiosk Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <select
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Select a location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.address ? `(${loc.address})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={!selectedLocation || creating}
                  className="gap-1"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Sessions */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No Active Kiosks</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a kiosk session to allow employees to clock in/out from a shared tablet.
              </p>
              <Button className="gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Create First Kiosk
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const kioskUrl = getKioskUrl(session.token)
              const locationObj = Array.isArray(session.location) ? session.location[0] : session.location

              return (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-primary" />
                          <p className="font-medium text-sm">
                            {locationObj?.name || "Unknown Location"}
                          </p>
                          <Badge variant="default" className="text-xs">Active</Badge>
                        </div>
                        {locationObj?.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {locationObj.address}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[300px]">
                            {kioskUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleCopy(session.id, kioskUrl)}
                          >
                            {copiedId === session.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <a
                            href={kioskUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Created {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDeactivate(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
