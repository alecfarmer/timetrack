"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { TimerDisplay } from "@/components/timer-display"
import { ComplianceWidget } from "@/components/compliance-widget"
import { EntryCard } from "@/components/entry-card"
import { LocationPicker } from "@/components/location-picker"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance, calculateDistance } from "@/lib/geo"
import { Menu, RefreshCw, MapPin, WifiOff, AlertCircle, LogOut, User } from "lucide-react"
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

// Page transition variants
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
  const [showMenu, setShowMenu] = useState(false)

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

      // Set default location or first location
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

      // Auto-select if within geofence
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

      // Refresh data
      await Promise.all([fetchCurrentStatus(), fetchWeekSummary()])

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clock in")
    }
  }

  const handleClockOut = async () => {
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

      // Refresh data
      await Promise.all([fetchCurrentStatus(), fetchWeekSummary()])

      // Haptic feedback if available
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-primary" />
          </motion.div>
          <p className="text-muted-foreground">Loading OnSite...</p>
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
          <motion.h1
            className="text-xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            OnSite
          </motion.h1>
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
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t bg-background"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

        {/* Compliance Widget */}
        {weekSummary && (
          <motion.div variants={staggerItem}>
            <ComplianceWidget
              daysWorked={weekSummary.daysWorked}
              requiredDays={weekSummary.requiredDays}
              weekDays={weekSummary.weekDays.map((d) => ({
                day: d.dayOfWeek,
                date: new Date(d.date),
                worked: d.worked,
              }))}
            />
          </motion.div>
        )}

        {/* Clock Card */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Location Display */}
              <motion.div
                className="text-center space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">
                    {selectedLocation?.name || "Select Location"}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {selectedLocation?.code && (
                    <Badge variant="secondary">{selectedLocation.code}</Badge>
                  )}
                  {distanceToSelected !== null && (
                    <span>· {formatDistance(distanceToSelected)} away</span>
                  )}
                  {gpsLoading && <span>· Getting location...</span>}
                  {gpsError && <span className="text-warning">· {gpsError}</span>}
                </div>
              </motion.div>

              {/* Location Picker */}
              <LocationPicker
                locations={locations}
                selectedId={selectedLocationId}
                userPosition={position}
                onSelect={setSelectedLocationId}
              />

              {/* Clock Button */}
              <ClockButton
                isClockedIn={currentStatus?.isClockedIn || false}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                disabled={!selectedLocationId}
              />

              {/* Timer */}
              <div className="flex justify-center">
                <TimerDisplay
                  startTime={
                    currentStatus?.currentSessionStart
                      ? new Date(currentStatus.currentSessionStart)
                      : null
                  }
                  label={currentStatus?.isClockedIn ? "on site" : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Entries */}
        <motion.div variants={staggerItem} className="space-y-3">
          <Separator />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
            Today
          </h2>

          <AnimatePresence mode="popLayout">
            {currentStatus?.todayEntries && currentStatus.todayEntries.length > 0 ? (
              <div className="space-y-2">
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
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No entries yet today
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.main>

      <BottomNav currentPath="/" />
    </motion.div>
  )
}
