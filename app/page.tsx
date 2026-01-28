"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { TimerDisplay } from "@/components/timer-display"
import { ComplianceWidget } from "@/components/compliance-widget"
import { EntryCard } from "@/components/entry-card"
import { LocationPicker } from "@/components/location-picker"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance, calculateDistance } from "@/lib/geo"
import { RefreshCw, MapPin, WifiOff, AlertCircle, LogOut, User, Clock, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"

interface Location {
  id: string
  name: string
  code: string | null
  category: string
  latitude: number
  longitude: number
  geofenceRadius: number
  isDefault: boolean
}

interface Entry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT"
  timestampServer: string
  timestampClient: string
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  notes: string | null
  location: {
    id: string
    name: string
    code: string | null
  }
}

interface WeekDay {
  date: string
  dayOfWeek: string
  worked: boolean
}

interface CurrentStatus {
  isClockedIn: boolean
  activeClockIn: Entry | null
  currentSessionStart: string | null
  todayEntries: Entry[]
  totalMinutesToday: number
}

interface WeekSummary {
  daysWorked: number
  requiredDays: number
  isCompliant: boolean
  weekDays: WeekDay[]
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

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null)
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const { position, loading: gpsLoading, error: gpsError, refresh: refreshGps } = useGeolocation(true)

  // Detect offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) throw new Error("Failed to fetch locations")
      const data = await res.json()
      setLocations(data)

      const defaultLoc = data.find((l: Location) => l.isDefault) || data[0]
      if (defaultLoc && !selectedLocationId) {
        setSelectedLocationId(defaultLoc.id)
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
      setError("Failed to load locations")
    }
  }, [selectedLocationId])

  // Fetch current status
  const fetchCurrentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/entries/current")
      if (!res.ok) throw new Error("Failed to fetch status")
      const data = await res.json()
      setCurrentStatus(data)
    } catch (err) {
      console.error("Error fetching current status:", err)
    }
  }, [])

  // Fetch week summary
  const fetchWeekSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/workdays/week")
      if (!res.ok) throw new Error("Failed to fetch week summary")
      const data = await res.json()
      setWeekSummary(data)
    } catch (err) {
      console.error("Error fetching week summary:", err)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchLocations(), fetchCurrentStatus(), fetchWeekSummary()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchLocations, fetchCurrentStatus, fetchWeekSummary])

  // Auto-select nearest location when GPS updates
  useEffect(() => {
    if (position && locations.length > 0) {
      const nearestLocation = locations.reduce((nearest, loc) => {
        const distance = calculateDistance(
          position.latitude,
          position.longitude,
          loc.latitude,
          loc.longitude
        )
        const nearestDistance = calculateDistance(
          position.latitude,
          position.longitude,
          nearest.latitude,
          nearest.longitude
        )
        return distance < nearestDistance ? loc : nearest
      })

      const distanceToNearest = calculateDistance(
        position.latitude,
        position.longitude,
        nearestLocation.latitude,
        nearestLocation.longitude
      )

      if (distanceToNearest <= nearestLocation.geofenceRadius) {
        setSelectedLocationId(nearestLocation.id)
      }
    }
  }, [position, locations])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchCurrentStatus(), fetchWeekSummary(), refreshGps()])
    setRefreshing(false)
  }

  const handleClockIn = async () => {
    if (!selectedLocationId) {
      setError("Please select a location")
      return
    }

    if (!position) {
      setError("Unable to get your location. Please enable GPS.")
      return
    }

    if (!isWithinGeofence) {
      const distance = distanceToSelected ? formatDistance(distanceToSelected) : "unknown"
      setError(`You must be on-site to clock in. You are ${distance} away from ${selectedLocation?.name || "the location"}.`)
      return
    }

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CLOCK_IN",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position?.latitude,
          gpsLongitude: position?.longitude,
          gpsAccuracy: position?.accuracy,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to clock in")
      }

      await Promise.all([fetchCurrentStatus(), fetchWeekSummary()])

      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clock in")
    }
  }

  const handleClockOut = async () => {
    if (!position) {
      setError("Unable to get your location. Please enable GPS.")
      return
    }

    if (!isWithinGeofence) {
      const distance = distanceToSelected ? formatDistance(distanceToSelected) : "unknown"
      setError(`You must be on-site to clock out. You are ${distance} away from ${selectedLocation?.name || "the location"}.`)
      return
    }

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CLOCK_OUT",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position?.latitude,
          gpsLongitude: position?.longitude,
          gpsAccuracy: position?.accuracy,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to clock out")
      }

      await Promise.all([fetchCurrentStatus(), fetchWeekSummary()])

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clock out")
    }
  }

  const selectedLocation = locations.find((l) => l.id === selectedLocationId)
  const distanceToSelected =
    position && selectedLocation
      ? calculateDistance(
          position.latitude,
          position.longitude,
          selectedLocation.latitude,
          selectedLocation.longitude
        )
      : null

  // Allow within geofence OR within 200m for flexibility with GPS accuracy
  const isWithinGeofence =
    distanceToSelected !== null &&
    selectedLocation &&
    distanceToSelected <= Math.max(selectedLocation.geofenceRadius, 200)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-primary opacity-20 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Loading OnSite...</p>
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
          <motion.div
            className="flex items-center gap-3 lg:hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">OnSite</h1>
              <p className="text-xs text-muted-foreground">Time & Attendance</p>
            </div>
          </motion.div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isOffline && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="warning" className="gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl"
            >
              <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
            </Button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
              <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                {user?.email}
              </span>
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-xl">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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

          {/* Desktop Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Clock Card */}
            <motion.div variants={staggerItem} className="lg:col-span-2">
              <Card className="overflow-hidden border-0 shadow-xl">
                {/* Status Banner */}
                <div
                  className={cn(
                    "px-6 py-3 flex items-center justify-between",
                    currentStatus?.isClockedIn
                      ? "bg-success/10 border-b border-success/20"
                      : "bg-muted/50 border-b"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "status-dot",
                        currentStatus?.isClockedIn ? "status-dot-success" : "bg-muted-foreground/30"
                      )}
                    />
                    <span className="text-sm font-medium">
                      {currentStatus?.isClockedIn ? "Currently On-Site" : "Off-Site"}
                    </span>
                  </div>
                  {currentStatus?.isClockedIn && selectedLocation && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedLocation.code || selectedLocation.name}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Timer Display */}
                  <div className="text-center py-4">
                    <TimerDisplay
                      startTime={
                        currentStatus?.currentSessionStart
                          ? new Date(currentStatus.currentSessionStart)
                          : null
                      }
                      label={currentStatus?.isClockedIn ? "on site" : undefined}
                    />
                  </div>

                  {/* Location Services Warning */}
                  {!position && !gpsLoading && (
                    <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <p className="font-medium text-warning">Location Services Required</p>
                          <p className="text-sm text-muted-foreground">
                            Enable location services to clock in or out. GPS confirmation is required to verify you are on-site.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-warning text-warning hover:bg-warning/10"
                            onClick={refreshGps}
                          >
                            Enable Location
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GPS Loading */}
                  {gpsLoading && (
                    <p className="text-sm text-center text-muted-foreground animate-pulse">
                      Getting your location...
                    </p>
                  )}

                  {/* Location Picker */}
                  {locations.length > 0 ? (
                    <LocationPicker
                      locations={locations}
                      selectedId={selectedLocationId}
                      userPosition={position}
                      onSelect={setSelectedLocationId}
                    />
                  ) : (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                      <p className="text-sm text-destructive font-medium">No locations loaded</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check your Supabase configuration in .env file
                      </p>
                    </div>
                  )}

                  {/* Distance debug info */}
                  {position && selectedLocation && distanceToSelected !== null && (
                    <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg p-2">
                      Distance to {selectedLocation.name}: {formatDistance(distanceToSelected)}
                      {isWithinGeofence ? " (within range)" : " (outside geofence)"}
                    </div>
                  )}

                  {/* Clock Button */}
                  <ClockButton
                    isClockedIn={currentStatus?.isClockedIn || false}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    disabled={!selectedLocationId || !position || !isWithinGeofence}
                  />

                  {/* Helper text */}
                  <p className="text-xs text-center text-muted-foreground">
                    Time is only logged when GPS confirms you are on-site
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Compliance & Stats */}
            <motion.div variants={staggerItem} className="space-y-6">
              {/* Compliance Widget */}
              {weekSummary && (
                <ComplianceWidget
                  daysWorked={weekSummary.daysWorked}
                  requiredDays={weekSummary.requiredDays}
                  weekDays={weekSummary.weekDays.map((d) => ({
                    day: d.dayOfWeek,
                    date: new Date(d.date),
                    worked: d.worked,
                  }))}
                />
              )}

              {/* Quick Stats */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {Math.floor((currentStatus?.totalMinutesToday || 0) / 60)}h{" "}
                        {(currentStatus?.totalMinutesToday || 0) % 60}m
                      </p>
                      <p className="text-sm text-muted-foreground">Today's Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile User Info */}
              <Card className="border-0 shadow-lg sm:hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {user?.email}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => signOut()}>
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Today's Entries */}
          <motion.div variants={staggerItem} className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Today's Activity</h2>
              <Badge variant="secondary">
                {currentStatus?.todayEntries?.length || 0} entries
              </Badge>
            </div>

            <AnimatePresence mode="popLayout">
              {currentStatus?.todayEntries && currentStatus.todayEntries.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentStatus.todayEntries.map((entry, index) => (
                    <EntryCard
                      key={entry.id}
                      type={entry.type}
                      timestamp={entry.timestampServer}
                      locationName={entry.location.name}
                      gpsAccuracy={entry.gpsAccuracy}
                      notes={entry.notes}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No entries yet today</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      Clock in to start tracking your time
                    </p>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.main>

      <BottomNav currentPath="/" />
    </motion.div>
  )
}
