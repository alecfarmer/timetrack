"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { TimerDisplay } from "@/components/timer-display"
import { EntryCard } from "@/components/entry-card"
import { LocationPicker } from "@/components/location-picker"
import { PhotoCapture } from "@/components/photo-capture"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo, LogoMark } from "@/components/logo"
import { DesktopMonitor, useDesktopMonitor } from "@/components/desktop-monitor"
import { Onboarding } from "@/components/onboarding"
import { StreaksWidget } from "@/components/streaks-widget"
import { OfflineBanner } from "@/components/offline-banner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationBell } from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useNotifications } from "@/hooks/use-notifications"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance } from "@/lib/geo"
import {
  RefreshCw,
  MapPin,
  WifiOff,
  AlertCircle,
  LogOut,
  Clock,
  TrendingUp,
  Monitor,
  Timer,
  CheckCircle2,
  PartyPopper,
  X,
  Coffee,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"

export default function Dashboard() {
  const router = useRouter()
  const { user, org, signOut } = useAuth()
  const { position, loading: gpsLoading, refresh: refreshGps } = useGeolocation(true)
  const desktopMonitor = useDesktopMonitor()
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)

  const clock = useClockState(position)

  // Check if photo verification feature is enabled for the org
  const [orgFeatures, setOrgFeatures] = useState<Record<string, boolean>>({})
  useEffect(() => {
    if (!org) return
    fetch("/api/org/features")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setOrgFeatures(data) })
      .catch(() => {})
  }, [org])

  useNotifications(
    clock.currentStatus
      ? {
          isClockedIn: clock.currentStatus.isClockedIn,
          currentSessionStart: clock.currentStatus.currentSessionStart,
          daysWorked: clock.weekSummary?.daysWorked || 0,
          requiredDays: clock.weekSummary?.requiredDays || 3,
        }
      : null
  )

  useKeyboardShortcuts()

  // Derive break start time from today's entries
  const breakStartTime = (() => {
    if (!clock.isOnBreak || !clock.currentStatus?.todayEntries) return null
    const entries = clock.currentStatus.todayEntries
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].type === "BREAK_START") {
        return new Date(entries[i].timestampServer)
      }
    }
    return null
  })()

  const handleClockInWithPhoto = async () => {
    if (orgFeatures.photoVerification && !clock.pendingPhotoUrl) {
      setShowPhotoCapture(true)
      return
    }
    await clock.handleClockIn()
  }

  const handlePhotoCapture = async (dataUrl: string) => {
    clock.setPendingPhotoUrl(dataUrl)
    setShowPhotoCapture(false)
    // Proceed with clock-in after photo capture
    await clock.handleClockIn()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  // Show onboarding for new users
  if (clock.needsOnboarding) {
    return <Onboarding onComplete={clock.handleOnboardingComplete} />
  }

  if (clock.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary opacity-20 animate-pulse-ring absolute inset-0" />
            <LogoMark className="w-20 h-20 rounded-2xl" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">OnSite</p>
            <p className="text-sm text-muted-foreground">Loading your workspace...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  const todayHours = Math.floor((clock.currentStatus?.totalMinutesToday || 0) / 60)
  const todayMinutes = (clock.currentStatus?.totalMinutesToday || 0) % 60

  return (
    <ErrorBoundary>
      {/* Photo Capture Overlay */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Background gradient */}
        <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

        {/* Desktop Monitor Widget */}
        <DesktopMonitor
          isVisible={desktopMonitor.isVisible}
          onClose={desktopMonitor.hide}
          isClockedIn={clock.currentStatus?.isClockedIn || false}
          clockInTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null}
          currentLocation={clock.selectedLocation?.name}
          locationCategory={clock.selectedLocation?.category}
          onClockIn={handleClockInWithPhoto}
          onClockOut={clock.handleClockOut}
          weeklyProgress={{
            daysWorked: clock.weekSummary?.daysWorked || 0,
            requiredDays: clock.weekSummary?.requiredDays || 3,
          }}
        />

        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b lg:ml-64">
          <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto lg:px-8">
            <motion.div className="lg:hidden" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Logo size="sm" />
            </motion.div>

            <div className="hidden lg:flex items-center gap-4">
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <Badge
                variant={clock.currentStatus?.isClockedIn ? "default" : "secondary"}
                className={cn("gap-1.5 transition-all", clock.currentStatus?.isClockedIn && "bg-success text-success-foreground")}
              >
                <span className={cn("w-2 h-2 rounded-full", clock.currentStatus?.isClockedIn ? "bg-white animate-pulse" : "bg-current")} />
                {clock.currentStatus?.isClockedIn ? "On-Site" : "Off-Site"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <AnimatePresence>
                {clock.isOffline && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <Badge variant="warning" className="gap-1"><WifiOff className="h-3 w-3" />Offline</Badge>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button variant="ghost" size="icon" onClick={desktopMonitor.toggle} className="hidden lg:flex rounded-xl" title="Toggle Desktop Monitor">
                <Monitor className={cn("h-5 w-5", desktopMonitor.isVisible && "text-primary")} />
              </Button>
              <NotificationBell />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => clock.handleRefresh(refreshGps)} disabled={clock.refreshing} className="rounded-xl">
                <RefreshCw className={cn("h-5 w-5", clock.refreshing && "animate-spin")} />
              </Button>

              <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-xl">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative pb-24 lg:pb-4 lg:ml-64">
          <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-4 space-y-4">
            <OfflineBanner onSyncComplete={() => Promise.all([clock.fetchCurrentStatus(), clock.fetchWeekSummary()])} />

            {/* Error Banner */}
            <AnimatePresence>
              {clock.error && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="card-elevated p-3 border-destructive/20 bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive flex-1">{clock.error}</p>
                    <Button variant="ghost" size="sm" onClick={() => clock.setError(null)} className="text-destructive hover:text-destructive">Dismiss</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 8-Hour Alert */}
            <AnimatePresence>
              {clock.eightHourAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="relative overflow-hidden rounded-xl border border-success/30 bg-success/10 p-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-success/5 via-success/10 to-success/5" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                      <PartyPopper className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-success">8-Hour Workday Complete</p>
                      <p className="text-xs text-success/80 mt-0.5">You've reached the standard workday threshold.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => clock.setEightHourAlert(false)} className="h-8 w-8 rounded-lg text-success hover:text-success hover:bg-success/20 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* === DESKTOP LAYOUT === */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4">
              {/* Column 1: Clock Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-4 space-y-3">
                <div className="card-elevated p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", clock.currentStatus?.isClockedIn ? "bg-success/20" : "bg-muted")}>
                      {clock.currentStatus?.isClockedIn ? <Timer className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{clock.currentStatus?.isClockedIn ? "Working at" : "Not clocked in"}</p>
                      <p className="font-semibold text-sm truncate">{clock.currentStatus?.isClockedIn && clock.selectedLocation ? clock.selectedLocation.name : "Select a location"}</p>
                    </div>
                  </div>

                  {!position && !gpsLoading && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-warning mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-warning">Location Required</p>
                          <Button size="sm" variant="outline" className="mt-1.5 h-7 text-xs border-warning text-warning" onClick={refreshGps}>Enable GPS</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {gpsLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Getting location...
                    </div>
                  )}

                  {clock.locations.length > 0 && (
                    <LocationPicker locations={clock.locations} selectedId={clock.selectedLocationId} userPosition={position} onSelect={clock.setSelectedLocationId} />
                  )}

                  {position && clock.selectedLocation && clock.distanceToSelected !== null && (
                    <div className={cn("flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg", clock.isWithinGeofence ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{formatDistance(clock.distanceToSelected)} from {clock.selectedLocation.name}</span>
                      {clock.isWithinGeofence && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                    </div>
                  )}

                  <ClockButton isClockedIn={clock.currentStatus?.isClockedIn || false} onClockIn={handleClockInWithPhoto} onClockOut={clock.handleClockOut} disabled={!clock.selectedLocationId || !position || !clock.isWithinGeofence} />

                  {/* Break buttons - shown when clocked in */}
                  {clock.currentStatus?.isClockedIn && (
                    <div className="pt-1">
                      {clock.isOnBreak ? (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-success/30 text-success hover:bg-success/10"
                          onClick={clock.handleBreakEnd}
                        >
                          <Play className="h-4 w-4" />
                          End Break
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-warning/30 text-warning hover:bg-warning/10"
                          onClick={clock.handleBreakStart}
                        >
                          <Coffee className="h-4 w-4" />
                          Start Break
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Column 2: Timer + Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="lg:col-span-4 space-y-3">
                <div className={cn("relative overflow-hidden rounded-2xl p-5", clock.currentStatus?.isClockedIn ? "card-highlight" : "card-elevated")}>
                  {clock.currentStatus?.isClockedIn && <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}
                  <div className="relative">
                    <TimerDisplay startTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null} label={clock.currentStatus?.isClockedIn ? "session time" : undefined} isOnBreak={clock.isOnBreak} breakStartTime={breakStartTime} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="card-elevated p-3 text-center">
                    <p className="text-xl font-bold tabular-nums">{todayHours}h {todayMinutes}m</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Today</p>
                  </div>
                  <div className="card-elevated p-3 text-center">
                    <p className="text-xl font-bold tabular-nums">{clock.currentStatus?.todayEntries?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entries</p>
                  </div>
                  <div className="card-elevated p-3 text-center">
                    <p className="text-xl font-bold tabular-nums">{clock.weekSummary?.daysWorked || 0}/{clock.weekSummary?.requiredDays || 3}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Week</p>
                  </div>
                </div>

                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Weekly Compliance</span></div>
                    <Badge variant={clock.weekSummary?.isCompliant ? "default" : "secondary"} className={cn("text-xs", clock.weekSummary?.isCompliant && "bg-success")}>
                      {clock.weekSummary?.isCompliant ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className={cn("progress-bar-fill", clock.weekSummary?.isCompliant ? "success" : "primary")} style={{ width: `${Math.min(100, ((clock.weekSummary?.daysWorked || 0) / (clock.weekSummary?.requiredDays || 3)) * 100)}%` }} />
                  </div>
                  <div className="flex gap-1">
                    {clock.weekSummary?.weekDays?.slice(0, 5).map((day, i) => (
                      <div key={i} className={cn("flex-1 h-7 rounded-md flex items-center justify-center text-[11px] font-medium transition-all", day.worked ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>
                        {day.dayOfWeek.slice(0, 2)}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Column 3: Today's Activity */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-4">
                <div className="card-elevated p-4 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold">Today's Activity</h2>
                    <Badge variant="secondary" className="text-xs">{clock.currentStatus?.todayEntries?.length || 0}</Badge>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {clock.currentStatus?.todayEntries && clock.currentStatus.todayEntries.length > 0 ? (
                        clock.currentStatus.todayEntries.map((entry, index) => (
                          <EntryCard key={entry.id} id={entry.id} type={entry.type} timestamp={entry.timestampServer} locationName={entry.location.name} gpsAccuracy={entry.gpsAccuracy} notes={entry.notes} photoUrl={entry.photoUrl} showCorrection={orgFeatures.manualCorrections} index={index} />
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center"><Clock className="h-6 w-6 text-muted-foreground/40" /></div>
                          <p className="text-sm text-muted-foreground">No entries yet</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">Clock in to start</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Desktop Streaks */}
            <div className="hidden lg:block mt-4"><ErrorBoundary><StreaksWidget /></ErrorBoundary></div>

            {/* === MOBILE LAYOUT === */}
            <div className="lg:hidden space-y-4">
              {/* Status Hero Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className={cn("relative overflow-hidden rounded-2xl p-5", clock.currentStatus?.isClockedIn ? "card-highlight" : "card-elevated")}>
                  {clock.currentStatus?.isClockedIn && <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}
                  <div className="relative space-y-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", clock.currentStatus?.isClockedIn ? "bg-success/20" : "bg-muted")}>
                        {clock.currentStatus?.isClockedIn ? <Timer className="h-5 w-5 text-success" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{clock.currentStatus?.isClockedIn ? "Currently working at" : "Not clocked in"}</p>
                        <p className="font-semibold">{clock.currentStatus?.isClockedIn && clock.selectedLocation ? clock.selectedLocation.name : "Ready to start"}</p>
                      </div>
                    </div>
                    <TimerDisplay startTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null} label={clock.currentStatus?.isClockedIn ? "session time" : undefined} isOnBreak={clock.isOnBreak} breakStartTime={breakStartTime} />
                    <div className="flex items-center gap-4">
                      <div><p className="text-2xl font-bold tabular-nums">{todayHours}h {todayMinutes}m</p><p className="text-xs text-muted-foreground">Today's total</p></div>
                      <div className="h-10 w-px bg-border" />
                      <div><p className="text-2xl font-bold tabular-nums">{clock.currentStatus?.todayEntries?.length || 0}</p><p className="text-xs text-muted-foreground">Entries</p></div>
                      <div className="h-10 w-px bg-border" />
                      <div><p className="text-2xl font-bold tabular-nums">{clock.weekSummary?.daysWorked || 0}/{clock.weekSummary?.requiredDays || 3}</p><p className="text-xs text-muted-foreground">Week</p></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Clock Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
                <div className="card-elevated p-4 space-y-3">
                  {!position && !gpsLoading && (
                    <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-warning mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-warning text-sm">Location Required</p>
                          <Button size="sm" variant="outline" className="mt-1.5 border-warning text-warning" onClick={refreshGps}>Enable GPS</Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {gpsLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />Getting your location...
                    </div>
                  )}
                  {clock.locations.length > 0 && <LocationPicker locations={clock.locations} selectedId={clock.selectedLocationId} userPosition={position} onSelect={clock.setSelectedLocationId} />}
                  {position && clock.selectedLocation && clock.distanceToSelected !== null && (
                    <div className={cn("flex items-center gap-2 text-sm px-3 py-2 rounded-lg", clock.isWithinGeofence ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      <MapPin className="h-4 w-4" /><span>{formatDistance(clock.distanceToSelected)} from {clock.selectedLocation.name}</span>{clock.isWithinGeofence && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                    </div>
                  )}
                  <ClockButton isClockedIn={clock.currentStatus?.isClockedIn || false} onClockIn={handleClockInWithPhoto} onClockOut={clock.handleClockOut} disabled={!clock.selectedLocationId || !position || !clock.isWithinGeofence} />

                  {/* Break buttons - shown when clocked in */}
                  {clock.currentStatus?.isClockedIn && (
                    <div>
                      {clock.isOnBreak ? (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-success/30 text-success hover:bg-success/10"
                          onClick={clock.handleBreakEnd}
                        >
                          <Play className="h-4 w-4" />
                          End Break
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-warning/30 text-warning hover:bg-warning/10"
                          onClick={clock.handleBreakStart}
                        >
                          <Coffee className="h-4 w-4" />
                          Start Break
                        </Button>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-center text-muted-foreground">GPS verification required</p>
                </div>
              </motion.div>

              {/* Weekly Progress */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Weekly Compliance</span></div>
                    <Badge variant={clock.weekSummary?.isCompliant ? "default" : "secondary"} className={cn("text-xs", clock.weekSummary?.isCompliant && "bg-success")}>{clock.weekSummary?.daysWorked || 0}/{clock.weekSummary?.requiredDays || 3} days</Badge>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className={cn("progress-bar-fill", clock.weekSummary?.isCompliant ? "success" : "primary")} style={{ width: `${Math.min(100, ((clock.weekSummary?.daysWorked || 0) / (clock.weekSummary?.requiredDays || 3)) * 100)}%` }} />
                  </div>
                  <div className="flex gap-1">
                    {clock.weekSummary?.weekDays?.slice(0, 5).map((day, i) => (
                      <div key={i} className={cn("flex-1 h-7 rounded-md flex items-center justify-center text-xs font-medium", day.worked ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>{day.dayOfWeek.slice(0, 2)}</div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}><ErrorBoundary><StreaksWidget /></ErrorBoundary></motion.div>

              {/* Today's Entries */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="heading-3">Today's Activity</h2>
                  <Badge variant="secondary" className="text-xs">{clock.currentStatus?.todayEntries?.length || 0}</Badge>
                </div>
                <AnimatePresence mode="popLayout">
                  {clock.currentStatus?.todayEntries && clock.currentStatus.todayEntries.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {clock.currentStatus.todayEntries.map((entry, index) => (
                        <EntryCard key={entry.id} id={entry.id} type={entry.type} timestamp={entry.timestampServer} locationName={entry.location.name} gpsAccuracy={entry.gpsAccuracy} notes={entry.notes} photoUrl={entry.photoUrl} showCorrection={orgFeatures.manualCorrections} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="card-elevated border-dashed py-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center"><Clock className="h-6 w-6 text-muted-foreground/40" /></div>
                      <p className="text-sm text-muted-foreground">No entries yet today</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">Clock in to start tracking</p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Mobile User Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="sm:hidden">
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-medium">{user?.email?.charAt(0).toUpperCase()}</div>
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        <BottomNav currentPath="/" />
      </div>
    </ErrorBoundary>
  )
}
