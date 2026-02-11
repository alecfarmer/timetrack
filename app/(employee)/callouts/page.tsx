"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { RefreshButton } from "@/components/pull-to-refresh"
import { CalloutCard, Callout } from "@/components/callout-card"
import { useGeolocation } from "@/hooks/use-geolocation"
import {
  Phone,
  Plus,
  AlertCircle,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Location {
  id: string
  name: string
  code: string | null
}

const PAGE_SIZE = 20

export default function CalloutsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [callouts, setCallouts] = useState<Callout[]>([])
  const [totalCallouts, setTotalCallouts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewCallout, setShowNewCallout] = useState(false)
  const [expandedCallouts, setExpandedCallouts] = useState<Set<string>>(new Set())

  const [incidentNumber, setIncidentNumber] = useState("")
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { position } = useGeolocation(true)

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) throw new Error("Failed to fetch locations")
      const data = await res.json()
      setLocations(data)
      if (data.length > 0 && !selectedLocationId) {
        const defaultLoc = data.find((l: Location) => l.code === "US0") || data[0]
        setSelectedLocationId(defaultLoc.id)
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
    }
  }, [selectedLocationId])

  const fetchCallouts = useCallback(async (offset = 0, append = false) => {
    try {
      const res = await fetch(`/api/callouts?limit=${PAGE_SIZE}&offset=${offset}`)
      if (!res.ok) throw new Error("Failed to fetch callouts")
      const data = await res.json()
      if (append) {
        setCallouts((prev) => [...prev, ...(data.callouts || [])])
      } else {
        setCallouts(data.callouts || [])
      }
      setTotalCallouts(data.total || 0)
    } catch (err) {
      console.error("Error fetching callouts:", err)
      setError("Failed to load callouts")
    }
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchLocations(), fetchCallouts()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchLocations, fetchCallouts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchLocations(), fetchCallouts()])
    setRefreshing(false)
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await fetchCallouts(callouts.length, true)
    setLoadingMore(false)
  }

  const handleStartCallout = async () => {
    if (!incidentNumber.trim()) { setError("Incident number is required"); return }
    if (!selectedLocationId) { setError("Please select a location"); return }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/callouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentNumber: incidentNumber.trim(),
          locationId: selectedLocationId,
          timeReceived: new Date().toISOString(),
          gpsLatitude: position?.latitude,
          gpsLongitude: position?.longitude,
          gpsAccuracy: position?.accuracy,
          description: description.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create callout")
      }
      setIncidentNumber("")
      setDescription("")
      setShowNewCallout(false)
      await fetchCallouts()
      if (navigator.vibrate) navigator.vibrate(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create callout")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartWork = async (calloutId: string) => {
    try {
      const res = await fetch(`/api/callouts/${calloutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeStarted: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error("Failed to start work")
      await fetchCallouts()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start work")
    }
  }

  const handleEndCallout = async (calloutId: string, resolution?: string) => {
    try {
      const res = await fetch(`/api/callouts/${calloutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeEnded: new Date().toISOString(), resolution: resolution || null }),
      })
      if (!res.ok) throw new Error("Failed to end callout")
      await fetchCallouts()
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end callout")
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedCallouts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeCallouts = callouts.filter((c) => !c.timeEnded)
  const completedCallouts = callouts.filter((c) => c.timeEnded)
  const hasMore = callouts.length < totalCallouts

  if (loading) {
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
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading callouts...</p>
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
      <PageHeader
        title="Callouts"
        subtitle="On-call incident tracking"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={handleRefresh} refreshing={refreshing} />
            <Button
              variant={showNewCallout ? "outline" : "default"}
              size="sm"
              onClick={() => setShowNewCallout(!showNewCallout)}
              className="gap-2 rounded-2xl"
            >
              {showNewCallout ? "Cancel" : <><Plus className="h-4 w-4" /><span className="hidden sm:inline">New Callout</span></>}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="px-4 pt-4 pb-2 max-w-6xl mx-auto lg:px-8">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-lg rounded-2xl text-center p-4">
            <p className="text-2xl font-bold text-warning">{activeCallouts.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          <Card className="border-0 shadow-lg rounded-2xl text-center p-4">
            <p className="text-2xl font-bold">{completedCallouts.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
          <Card className="border-0 shadow-lg rounded-2xl text-center p-4">
            <p className="text-2xl font-bold">{totalCallouts}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="rounded-lg">Dismiss</Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Form / Stats */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {showNewCallout ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-0 shadow-xl rounded-2xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <PhoneIncoming className="h-5 w-5 text-primary" />
                          Log New Callout
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="incident">Incident Number *</Label>
                          <Input
                            id="incident"
                            placeholder="e.g., INC0012345"
                            value={incidentNumber}
                            onChange={(e) => setIncidentNumber(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location *</Label>
                          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                  {loc.code ? `${loc.code} - ${loc.name}` : loc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (optional)</Label>
                          <Textarea
                            id="description"
                            placeholder="Brief description of the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="rounded-xl"
                          />
                        </div>
                        <Button
                          className="w-full gap-2 rounded-xl"
                          onClick={handleStartCallout}
                          disabled={submitting}
                        >
                          {submitting ? "Logging..." : <><Phone className="h-4 w-4" />Log Callout</>}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-0 shadow-lg rounded-2xl">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                            <Phone className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-4xl font-bold">{activeCallouts.length}</p>
                            <p className="text-sm text-muted-foreground">Active Callouts</p>
                          </div>
                          <Button
                            className="w-full rounded-xl"
                            onClick={() => setShowNewCallout(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Log New Callout
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Callout list */}
            <div className="lg:col-span-2 space-y-6">
              {activeCallouts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Active Callouts</h2>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0">{activeCallouts.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {activeCallouts.map((callout) => (
                      <CalloutCard
                        key={callout.id}
                        callout={callout}
                        expanded={expandedCallouts.has(callout.id)}
                        onToggleExpand={() => toggleExpanded(callout.id)}
                        onStartWork={() => handleStartWork(callout.id)}
                        onEndCallout={(resolution) => handleEndCallout(callout.id, resolution)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Callouts</h2>
                {completedCallouts.length > 0 ? (
                  <div className="space-y-3">
                    {completedCallouts.map((callout) => (
                      <CalloutCard
                        key={callout.id}
                        callout={callout}
                        expanded={expandedCallouts.has(callout.id)}
                        onToggleExpand={() => toggleExpanded(callout.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed rounded-2xl">
                    <CardContent className="py-12 text-center">
                      <PhoneOutgoing className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No completed callouts yet</p>
                      <p className="text-sm text-muted-foreground/60 mt-1">Completed callouts will appear here</p>
                    </CardContent>
                  </Card>
                )}

                {hasMore && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : `Load More (${callouts.length} of ${totalCallouts})`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  )
}
