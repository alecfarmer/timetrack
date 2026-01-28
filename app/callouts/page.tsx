"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export default function CalloutsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [callouts, setCallouts] = useState<Callout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewCallout, setShowNewCallout] = useState(false)
  const [expandedCallouts, setExpandedCallouts] = useState<Set<string>>(new Set())

  // New callout form
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

      // Reset form and refresh
      setIncidentNumber("")
      setDescription("")
      setShowNewCallout(false)
      await fetchCallouts()

      // Haptic feedback
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

      // Haptic feedback
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
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Phone className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading callouts...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold">Callouts</h1>
          <Button
            variant={showNewCallout ? "outline" : "default"}
            size="sm"
            onClick={() => setShowNewCallout(!showNewCallout)}
            className="gap-2"
          >
            {showNewCallout ? (
              "Cancel"
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Callout
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="flex-1 p-4 pb-24 space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Callout Form */}
        <AnimatePresence>
          {showNewCallout && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5" />
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Select
                      value={selectedLocationId}
                      onValueChange={setSelectedLocationId}
                    >
                      <SelectTrigger>
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
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full gap-2"
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
          )}
        </AnimatePresence>

        {/* Active Callouts */}
        {activeCallouts.length > 0 && (
          <motion.div variants={staggerItem} className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
              Active Callouts
            </h2>
            <div className="space-y-2">
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
          </motion.div>
        )}

        {/* Completed Callouts */}
        <motion.div variants={staggerItem} className="space-y-3">
          <Separator />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
            Recent Callouts
          </h2>

          {completedCallouts.length > 0 ? (
            <div className="space-y-2">
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
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-8"
            >
              No completed callouts yet
            </motion.p>
          )}
        </motion.div>
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
        className={
          isActive
            ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
            : ""
        }
      >
        <CardContent className="p-4">
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">
                  {callout.incidentNumber}
                </span>
                {isActive && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:text-amber-300"
                  >
                    {isWorking ? "In Progress" : "Active"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {callout.location.code || callout.location.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(callout.timeReceived), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{calculateDuration()}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t space-y-3"
              >
                {callout.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Description
                    </Label>
                    <p className="text-sm">{callout.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Time Received
                    </Label>
                    <p>{format(new Date(callout.timeReceived), "h:mm:ss a")}</p>
                  </div>
                  {callout.timeStarted && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Work Started
                      </Label>
                      <p>
                        {format(new Date(callout.timeStarted), "h:mm:ss a")}
                      </p>
                    </div>
                  )}
                  {callout.timeEnded && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Time Ended
                      </Label>
                      <p>{format(new Date(callout.timeEnded), "h:mm:ss a")}</p>
                    </div>
                  )}
                </div>

                {callout.resolution && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Resolution
                    </Label>
                    <p className="text-sm">{callout.resolution}</p>
                  </div>
                )}

                {isActive && (
                  <div className="space-y-2 pt-2">
                    {!callout.timeStarted && onStartWork && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
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
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full gap-2"
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
