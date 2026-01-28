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
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useGeolocation } from "@/hooks/use-geolocation"
import { format } from "date-fns"
import {
  Phone,
  PhoneOff,
  Plus,
  Clock,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react"

interface Location {
  id: string
  name: string
  code: string | null
}

interface Callout {
  id: string
  incidentNumber: string
  locationId: string
  location: Location
  timeReceived: string
  timeStarted: string | null
  timeEnded: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  description: string | null
  resolution: string | null
  createdAt: string
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function CalloutsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [callouts, setCallouts] = useState<Callout[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchCallouts = useCallback(async () => {
    try {
      const res = await fetch("/api/callouts?limit=50")
      if (!res.ok) throw new Error("Failed to fetch callouts")
      const data = await res.json()
      setCallouts(data.callouts || [])
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

  const handleStartCallout = async () => {
    if (!incidentNumber.trim()) {
      setError("Incident number is required")
      return
    }
    if (!selectedLocationId) {
      setError("Please select a location")
      return
    }

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

      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
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
        body: JSON.stringify({
          timeStarted: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to start work")
      }

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
        body: JSON.stringify({
          timeEnded: new Date().toISOString(),
          resolution: resolution || null,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to end callout")
      }

      await fetchCallouts()

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end callout")
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedCallouts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const activeCallouts = callouts.filter((c) => !c.timeEnded)
  const completedCallouts = callouts.filter((c) => c.timeEnded)

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
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Callouts</h1>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold">Callouts</h1>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant={showNewCallout ? "outline" : "default"}
              size="sm"
              onClick={() => setShowNewCallout(!showNewCallout)}
              className="gap-2 rounded-xl"
            >
              {showNewCallout ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Callout</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="flex-1 pb-24 lg:pb-8 lg:ml-64"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="rounded-lg"
                >
                  Dismiss
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* New Callout Form - Left Column on Desktop */}
            <motion.div variants={staggerItem} className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {showNewCallout ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="border-0 shadow-xl">
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
                          <Select
                            value={selectedLocationId}
                            onValueChange={setSelectedLocationId}
                          >
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
                          {submitting ? (
                            "Logging..."
                          ) : (
                            <>
                              <Phone className="h-4 w-4" />
                              Log Callout
                            </>
                          )}
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
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                            <Phone className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-4xl font-bold">{activeCallouts.length}</p>
                            <p className="text-sm text-muted-foreground">Active Callouts</p>
                          </div>
                          <div className="pt-4 border-t grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-semibold">{completedCallouts.length}</p>
                              <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                            <div>
                              <p className="text-2xl font-semibold">{callouts.length}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Callouts List - Right Column on Desktop */}
            <motion.div variants={staggerItem} className="lg:col-span-2 space-y-6">
              {/* Active Callouts */}
              {activeCallouts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="status-dot status-dot-warning" />
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Active Callouts
                    </h2>
                    <Badge variant="warning">{activeCallouts.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {activeCallouts.map((callout) => (
                      <CalloutCard
                        key={callout.id}
                        callout={callout}
                        expanded={expandedCallouts.has(callout.id)}
                        onToggleExpand={() => toggleExpanded(callout.id)}
                        onStartWork={() => handleStartWork(callout.id)}
                        onEndCallout={(resolution) =>
                          handleEndCallout(callout.id, resolution)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Callouts */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Recent Callouts
                </h2>

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
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <PhoneOutgoing className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No completed callouts yet</p>
                      <p className="text-sm text-muted-foreground/60 mt-1">
                        Completed callouts will appear here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.main>

      <BottomNav currentPath="/callouts" />
    </motion.div>
  )
}

interface CalloutCardProps {
  callout: Callout
  expanded: boolean
  onToggleExpand: () => void
  onStartWork?: () => void
  onEndCallout?: (resolution?: string) => void
}

function CalloutCard({
  callout,
  expanded,
  onToggleExpand,
  onStartWork,
  onEndCallout,
}: CalloutCardProps) {
  const [resolution, setResolution] = useState("")
  const isActive = !callout.timeEnded
  const isWorking = callout.timeStarted && !callout.timeEnded

  const calculateDuration = () => {
    const start = new Date(callout.timeReceived)
    const end = callout.timeEnded ? new Date(callout.timeEnded) : new Date()
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000)

    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className={`border-0 shadow-lg transition-all ${
          isActive
            ? "ring-2 ring-warning/50 bg-warning/5"
            : "hover:shadow-xl"
        }`}
      >
        <CardContent className="p-4">
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-lg">
                  {callout.incidentNumber}
                </span>
                {isActive && (
                  <Badge
                    variant="warning"
                    className="gap-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {isWorking ? "In Progress" : "Active"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {callout.location.code || callout.location.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(new Date(callout.timeReceived), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-semibold">{calculateDuration()}</p>
                <p className="text-xs text-muted-foreground">duration</p>
              </div>
              {expanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t space-y-4"
              >
                {callout.description && (
                  <div className="bg-muted/50 rounded-xl p-3">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm mt-1">{callout.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <Label className="text-xs text-muted-foreground">Received</Label>
                    <p className="font-medium">{format(new Date(callout.timeReceived), "h:mm:ss a")}</p>
                  </div>
                  {callout.timeStarted && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <Label className="text-xs text-muted-foreground">Started</Label>
                      <p className="font-medium">{format(new Date(callout.timeStarted), "h:mm:ss a")}</p>
                    </div>
                  )}
                  {callout.timeEnded && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <Label className="text-xs text-muted-foreground">Ended</Label>
                      <p className="font-medium">{format(new Date(callout.timeEnded), "h:mm:ss a")}</p>
                    </div>
                  )}
                </div>

                {callout.resolution && (
                  <div className="bg-success/10 rounded-xl p-3">
                    <Label className="text-xs text-success">Resolution</Label>
                    <p className="text-sm mt-1">{callout.resolution}</p>
                  </div>
                )}

                {isActive && (
                  <div className="space-y-3 pt-2">
                    {!callout.timeStarted && onStartWork && (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation()
                          onStartWork()
                        }}
                      >
                        Start Working
                      </Button>
                    )}

                    {onEndCallout && (
                      <>
                        <Textarea
                          placeholder="Resolution notes (optional)"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          rows={2}
                          className="rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="default"
                          className="w-full gap-2 rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEndCallout(resolution)
                          }}
                        >
                          <PhoneOff className="h-4 w-4" />
                          End Callout
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
