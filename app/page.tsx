"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { TimerDisplay } from "@/components/timer-display"
import { ComplianceWidget } from "@/components/compliance-widget"
import { EntryCard } from "@/components/entry-card"
import { LocationPicker } from "@/components/location-picker"
import { ThemeToggle } from "@/components/theme-toggle"
import { DesktopMonitor, useDesktopMonitor } from "@/components/desktop-monitor"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance, calculateDistance } from "@/lib/geo"
import {
  RefreshCw,
  MapPin,
  WifiOff,
  AlertCircle,
  LogOut,
  User,
  Clock,
  Building2,
  Zap,
  TrendingUp,
  Monitor,
  ChevronRight,
  Timer,
  CheckCircle2,
  Circle,
} from "lucide-react"
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
  const desktopMonitor = useDesktopMonitor()

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
        const distance = calculateDistance(position.latitude, position.longitude, loc.latitude, loc.longitude)
        const nearestDistance = calculateDistance(position.latitude, position.longitude, nearest.latitude, nearest.longitude)
        return distance < nearestDistance ? loc : nearest
      })
      const distanceToNearest = calculateDistance(position.latitude, position.longitude, nearestLocation.latitude, nearestLocation.longitude)
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
      if (navigator.vibrate) navigator.vibrate(100)
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
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clock out")
    }
  }

  const selectedLocation = locations.find((l) => l.id === selectedLocationId)
  const distanceToSelected =
    position && selectedLocation
      ? calculateDistance(position.latitude, position.longitude, selectedLocation.latitude, selectedLocation.longitude)
      : null
  const isWithinGeofence =
    distanceToSelected !== null && selectedLocation && distanceToSelected <= Math.max(selectedLocation.geofenceRadius, 200)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary opacity-20 animate-pulse-ring absolute inset-0" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">OnSite</p>
            <p className="text-sm text-muted-foreground">Loading your workspace...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  const todayHours = Math.floor((currentStatus?.totalMinutesToday || 0) / 60)
  const todayMinutes = (currentStatus?.totalMinutesToday || 0) % 60

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Desktop Monitor Widget */}
      <DesktopMonitor
        isVisible={desktopMonitor.isVisible}
        onClose={desktopMonitor.hide}
        isClockedIn={currentStatus?.isClockedIn || false}
        clockInTime={currentStatus?.currentSessionStart ? new Date(currentStatus.currentSessionStart) : null}
        currentLocation={selectedLocation?.name}
        locationCategory={selectedLocation?.category}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        weeklyProgress={{
          daysWorked: weekSummary?.daysWorked || 0,
          requiredDays: weekSummary?.requiredDays || 3,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b lg:ml-64">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
          {/* Mobile Logo */}
          <motion.div
            className="flex items-center gap-3 lg:hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg animate-float">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">OnSite</h1>
              <p className="text-xs text-muted-foreground">Time Tracking</p>
            </div>
          </motion.div>

          {/* Desktop Title */}
          <div className="hidden lg:flex items-center gap-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <Badge
              variant={currentStatus?.isClockedIn ? "default" : "secondary"}
              className={cn(
                "gap-1.5 transition-all",
                currentStatus?.isClockedIn && "bg-success text-success-foreground"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", currentStatus?.isClockedIn ? "bg-white animate-pulse" : "bg-current")} />
              {currentStatus?.isClockedIn ? "On-Site" : "Off-Site"}
            </Badge>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isOffline && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <Badge variant="warning" className="gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Monitor Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={desktopMonitor.toggle}
              className="hidden lg:flex rounded-xl"
              title="Toggle Desktop Monitor"
            >
              <Monitor className={cn("h-5 w-5", desktopMonitor.isVisible && "text-primary")} />
            </Button>

            <ThemeToggle />

            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="rounded-xl">
              <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
            </Button>

            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-xl">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pb-24 lg:pb-8 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 space-y-6">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="card-elevated p-4 border-destructive/20 bg-destructive/5"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive flex-1">{error}</p>
                  <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-destructive hover:text-destructive">
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Hero Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-6 lg:p-8",
                currentStatus?.isClockedIn
                  ? "card-highlight"
                  : "card-elevated"
              )}
            >
              {/* Decorative elements */}
              {currentStatus?.isClockedIn && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              )}

              <div className="relative grid lg:grid-cols-2 gap-8">
                {/* Left: Timer & Status */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        currentStatus?.isClockedIn ? "bg-success/20" : "bg-muted"
                      )}
                    >
                      {currentStatus?.isClockedIn ? (
                        <Timer className="h-6 w-6 text-success" />
                      ) : (
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {currentStatus?.isClockedIn ? "Currently working at" : "Not clocked in"}
                      </p>
                      <p className="font-semibold text-lg">
                        {currentStatus?.isClockedIn && selectedLocation
                          ? selectedLocation.name
                          : "Ready to start"}
                      </p>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="py-4">
                    <TimerDisplay
                      startTime={currentStatus?.currentSessionStart ? new Date(currentStatus.currentSessionStart) : null}
                      label={currentStatus?.isClockedIn ? "session time" : undefined}
                    />
                  </div>

                  {/* Today's Stats */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-3xl font-bold tabular-nums">
                        {todayHours}h {todayMinutes}m
                      </p>
                      <p className="text-sm text-muted-foreground">Today's total</p>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div>
                      <p className="text-3xl font-bold tabular-nums">{currentStatus?.todayEntries?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Entries</p>
                    </div>
                  </div>
                </div>

                {/* Right: Clock Actions */}
                <div className="space-y-4">
                  {/* GPS Warning */}
                  {!position && !gpsLoading && (
                    <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-warning mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-warning">Location Required</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Enable GPS to verify your on-site presence.
                          </p>
                          <Button size="sm" variant="outline" className="mt-2 border-warning text-warning" onClick={refreshGps}>
                            Enable Location
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {gpsLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Getting your location...
                    </div>
                  )}

                  {/* Location Picker */}
                  {locations.length > 0 && (
                    <LocationPicker
                      locations={locations}
                      selectedId={selectedLocationId}
                      userPosition={position}
                      onSelect={setSelectedLocationId}
                    />
                  )}

                  {/* Distance Info */}
                  {position && selectedLocation && distanceToSelected !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                        isWithinGeofence ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>
                        {formatDistance(distanceToSelected)} from {selectedLocation.name}
                      </span>
                      {isWithinGeofence && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                    </div>
                  )}

                  {/* Clock Button */}
                  <ClockButton
                    isClockedIn={currentStatus?.isClockedIn || false}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    disabled={!selectedLocationId || !position || !isWithinGeofence}
                  />

                  <p className="text-xs text-center text-muted-foreground">
                    GPS verification required for time logging
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Weekly Compliance */}
            <div className="card-elevated p-4 sm:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-medium">Weekly Progress</span>
                </div>
                <Badge variant={weekSummary?.isCompliant ? "default" : "secondary"} className={weekSummary?.isCompliant ? "bg-success" : ""}>
                  {weekSummary?.daysWorked || 0}/{weekSummary?.requiredDays || 3} days
                </Badge>
              </div>
              <div className="progress-bar mb-3">
                <div
                  className={cn("progress-bar-fill", weekSummary?.isCompliant ? "success" : "primary")}
                  style={{ width: `${Math.min(100, ((weekSummary?.daysWorked || 0) / (weekSummary?.requiredDays || 3)) * 100)}%` }}
                />
              </div>
              <div className="flex gap-1">
                {weekSummary?.weekDays?.slice(0, 5).map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                      day.worked ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {day.dayOfWeek.slice(0, 1)}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{currentStatus?.todayEntries?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </div>

            <div className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{weekSummary?.daysWorked || 0}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Today's Entries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="heading-3">Today's Activity</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
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
                <div className="card-elevated border-dashed">
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium text-muted-foreground">No entries yet today</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Clock in to start tracking your time</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mobile User Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="sm:hidden"
          >
            <div className="card-elevated p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <BottomNav currentPath="/" />
    </div>
  )
}
