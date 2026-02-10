"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { TimerDisplay } from "@/components/timer-display"
import { EntryCard } from "@/components/entry-card"
import { LocationPicker } from "@/components/location-picker"
import { PhotoCapture } from "@/components/photo-capture"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"
import { DesktopMonitor, useDesktopMonitor } from "@/components/desktop-monitor"
import { Onboarding } from "@/components/onboarding"
import { StreaksWidget } from "@/components/streaks-widget"
import { WeeklyHoursMini } from "@/components/weekly-hours-mini"
import { TeamOnSite } from "@/components/team-on-site"
import { OfflineBanner } from "@/components/offline-banner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationBell } from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useNotifications } from "@/hooks/use-notifications"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance } from "@/lib/geo"
import { format } from "date-fns"
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
  BarChart3,
  Phone,
  Palmtree,
  ArrowRight,
  Calendar,
  Target,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Building2,
  Home,
  Sun,
  Moon,
  Flame,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function formatTime(date: Date) {
  return format(date, "h:mm a")
}

function getLocationIcon(category?: string) {
  switch (category) {
    case "HOME":
      return Home
    case "COWORKING":
      return Coffee
    default:
      return Building2
  }
}

export default function Dashboard() {
  const router = useRouter()
  const { user, org, signOut, loading: authLoading } = useAuth()
  const { position, loading: gpsLoading, refresh: refreshGps } = useGeolocation(true)
  const desktopMonitor = useDesktopMonitor()
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)

  const clock = useClockState(position, !authLoading && !!user)

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

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

  if (authLoading || clock.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
            <LogoMark className="relative w-16 h-16 rounded-2xl" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </motion.div>
      </div>
    )
  }

  const todayHours = Math.floor((clock.currentStatus?.totalMinutesToday || 0) / 60)
  const todayMinutes = (clock.currentStatus?.totalMinutesToday || 0) % 60
  const weekHours = Math.floor((clock.weekSummary?.totalMinutes || 0) / 60)
  const weekMinutes = (clock.weekSummary?.totalMinutes || 0) % 60
  const weekProgress = Math.min(100, ((clock.weekSummary?.daysWorked || 0) / (clock.weekSummary?.requiredDays || 3)) * 100)
  const todayProgress = Math.min(100, (todayHours / 8) * 100)
  const entries = clock.currentStatus?.todayEntries || []
  const displayedEntries = showAllEntries ? entries : entries.slice(0, 3)
  const LocationIcon = getLocationIcon(clock.selectedLocation?.category)
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"

  return (
    <ErrorBoundary>
      {/* Photo Capture Overlay */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

      <div className="min-h-screen bg-background pb-24 lg:pb-8">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

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
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <LogoMark className="w-9 h-9 rounded-xl" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{getGreeting()}</p>
                  <p className="text-xs text-muted-foreground capitalize">{firstName}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <AnimatePresence>
                  {clock.isOffline && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium mr-2"
                    >
                      <WifiOff className="h-3 w-3" />
                      <span>Offline</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={desktopMonitor.toggle}
                  className="hidden lg:flex rounded-xl"
                  title="Toggle Desktop Monitor"
                >
                  <Monitor className={cn("h-5 w-5", desktopMonitor.isVisible && "text-primary")} />
                </Button>
                <NotificationBell />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => clock.handleRefresh(refreshGps)}
                  disabled={clock.refreshing}
                  className="rounded-xl"
                >
                  <RefreshCw className={cn("h-5 w-5", clock.refreshing && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <OfflineBanner onSyncComplete={() => Promise.all([clock.fetchCurrentStatus(), clock.fetchWeekSummary()])} />

          {/* Error Banner */}
          <AnimatePresence>
            {clock.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{clock.error}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => clock.setError(null)} className="text-destructive hover:text-destructive h-7 px-2">
                  Dismiss
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 8-Hour Achievement */}
          <AnimatePresence>
            {clock.eightHourAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">8-Hour Workday Complete</p>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">Great work today!</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => clock.setEightHourAlert(false)}
                    className="h-8 w-8 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Clock Action */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Clock Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className={cn(
                  "relative overflow-hidden rounded-2xl border transition-all duration-500",
                  clock.currentStatus?.isClockedIn
                    ? "bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border-primary/20"
                    : "bg-card border-border/50"
                )}>
                  {/* Ambient glow when clocked in */}
                  {clock.currentStatus?.isClockedIn && (
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                  )}

                  <div className="relative p-6 sm:p-8">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        clock.currentStatus?.isClockedIn
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          clock.currentStatus?.isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                        )} />
                        {clock.currentStatus?.isClockedIn ? "Currently Working" : "Not Clocked In"}
                      </div>

                      {clock.currentStatus?.isClockedIn && clock.selectedLocation && (
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                          <LocationIcon className="h-4 w-4" />
                          <span>{clock.selectedLocation.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Timer Display */}
                    <div className="mb-8">
                      <TimerDisplay
                        startTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null}
                        label={clock.currentStatus?.isClockedIn ? "Current Session" : "Ready to Start"}
                        isOnBreak={clock.isOnBreak}
                        breakStartTime={breakStartTime}
                        size="large"
                      />
                    </div>

                    {/* Location & Clock Button Row */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Location Picker */}
                      <div className="flex-1">
                        {!position && !gpsLoading ? (
                          <button
                            onClick={refreshGps}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5" />
                              <span className="font-medium">Enable Location</span>
                            </div>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : gpsLoading ? (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Getting location...</span>
                          </div>
                        ) : clock.locations.length > 0 ? (
                          <LocationPicker
                            locations={clock.locations}
                            selectedId={clock.selectedLocationId}
                            userPosition={position}
                            onSelect={clock.setSelectedLocationId}
                            variant="compact"
                          />
                        ) : null}

                        {/* Distance indicator */}
                        {position && clock.selectedLocation && clock.distanceToSelected !== null && (
                          <div className={cn(
                            "flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs",
                            clock.isWithinGeofence
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          )}>
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{formatDistance(clock.distanceToSelected)} away</span>
                            {clock.isWithinGeofence && <CheckCircle2 className="h-3.5 w-3.5 ml-1" />}
                          </div>
                        )}
                      </div>

                      {/* Clock Button */}
                      <div className="sm:w-72">
                        <ClockButton
                          isClockedIn={clock.currentStatus?.isClockedIn || false}
                          onClockIn={handleClockInWithPhoto}
                          onClockOut={clock.handleClockOut}
                          disabled={!clock.selectedLocationId || !position || !clock.isWithinGeofence}
                        />
                      </div>
                    </div>

                    {/* Break buttons - shown when clocked in */}
                    {clock.currentStatus?.isClockedIn && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        {clock.isOnBreak ? (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={clock.handleBreakEnd}
                          >
                            <Play className="h-4 w-4" />
                            End Break
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            onClick={clock.handleBreakStart}
                          >
                            <Coffee className="h-4 w-4" />
                            Start Break
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {/* Today's Hours */}
                <div className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    {todayProgress >= 100 && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{todayHours}h {todayMinutes}m</p>
                  <p className="text-xs text-muted-foreground mt-1">Today</p>
                  <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${todayProgress}%` }}
                    />
                  </div>
                </div>

                {/* Week Hours */}
                <div className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Calendar className="h-4 w-4 text-violet-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{weekHours}h {weekMinutes}m</p>
                  <p className="text-xs text-muted-foreground mt-1">This Week</p>
                  <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (weekHours / 40) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Days On-Site */}
                <div className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Target className="h-4 w-4 text-emerald-500" />
                    </div>
                    {clock.weekSummary?.isCompliant && (
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    {clock.weekSummary?.daysWorked || 0}
                    <span className="text-base font-normal text-muted-foreground">/{clock.weekSummary?.requiredDays || 3}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Days On-Site</p>
                  <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        clock.weekSummary?.isCompliant ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${weekProgress}%` }}
                    />
                  </div>
                </div>

                {/* Entries Today */}
                <div className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Zap className="h-4 w-4 text-orange-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{entries.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Entries Today</p>
                  <div className="mt-3 flex gap-1">
                    {entries.slice(0, 4).map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 h-1 rounded-full",
                          entry.type === "CLOCK_IN" ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      />
                    ))}
                    {entries.length === 0 && (
                      <div className="flex-1 h-1 rounded-full bg-muted" />
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Weekly Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-xl bg-card border border-border/50 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Weekly Overview</h2>
                  <Link
                    href="/app/history"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    View History
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {clock.weekSummary?.weekDays?.map((day, i) => {
                    const hours = Math.floor((day.minutes || 0) / 60)
                    const mins = (day.minutes || 0) % 60
                    const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                    const isWeekend = i === 0 || i === 6

                    return (
                      <div
                        key={day.date}
                        className={cn(
                          "relative flex flex-col items-center py-3 rounded-xl transition-colors",
                          isToday ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50",
                          isWeekend && "opacity-50"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider mb-2",
                          isToday ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {day.dayOfWeek.slice(0, 3)}
                        </span>

                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
                          day.worked
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        )}>
                          {day.worked ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">{new Date(day.date).getDate()}</span>
                          )}
                        </div>

                        <span className={cn(
                          "text-xs tabular-nums",
                          day.minutes > 0 ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                          {day.minutes > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : "-"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Desktop: Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="hidden lg:block"
              >
                <WeeklyHoursMini weekDays={clock.weekSummary?.weekDays} />
              </motion.div>
            </div>

            {/* Right Column - Activity & Rewards */}
            <div className="space-y-6">
              {/* Today's Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-xl bg-card border border-border/50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <h2 className="font-semibold">Today's Activity</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">{entries.length} entries</span>
                </div>

                <div className="divide-y divide-border/50">
                  <AnimatePresence mode="popLayout">
                    {displayedEntries.length > 0 ? (
                      displayedEntries.map((entry, index) => {
                        const isClockIn = entry.type === "CLOCK_IN"
                        const time = new Date(entry.timestampServer)

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              isClockIn
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-rose-500/10 text-rose-500"
                            )}>
                              {isClockIn ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {isClockIn ? "Clocked In" : "Clocked Out"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {entry.location?.name || "Unknown location"}
                              </p>
                            </div>
                            <span className="text-sm text-muted-foreground tabular-nums">
                              {formatTime(time)}
                            </span>
                          </motion.div>
                        )
                      })
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Clock in to get started</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {entries.length > 3 && (
                  <button
                    onClick={() => setShowAllEntries(!showAllEntries)}
                    className="w-full px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 border-t border-border/50"
                  >
                    {showAllEntries ? "Show less" : `Show ${entries.length - 3} more`}
                    <ChevronRight className={cn("h-3 w-3 transition-transform", showAllEntries && "rotate-90")} />
                  </button>
                )}
              </motion.div>

              {/* Rewards Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <ErrorBoundary>
                  <StreaksWidget />
                </ErrorBoundary>
              </motion.div>

              {/* Team On-Site */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <TeamOnSite />
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="grid grid-cols-2 gap-3"
              >
                <Link
                  href="/app/history"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">History</span>
                </Link>
                <Link
                  href="/app/reports"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
                >
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">Reports</span>
                </Link>
                <Link
                  href="/app/leave"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
                >
                  <Palmtree className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">Leave</span>
                </Link>
                <Link
                  href="/app/callouts"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
                >
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">Callouts</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
