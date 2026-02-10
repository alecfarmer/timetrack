"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { LocationPicker } from "@/components/location-picker"
import { PhotoCapture } from "@/components/photo-capture"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"
import { Onboarding } from "@/components/onboarding"
import { OfflineBanner } from "@/components/offline-banner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationCenter } from "@/components/notification-center"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { Button } from "@/components/ui/button"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useTimer } from "@/hooks/use-timer"
import { useRealtime, useLiveXP, useLiveCompliance } from "@/contexts/realtime-context"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance } from "@/lib/geo"
import { formatTime, formatDate } from "@/lib/dates"
import { format } from "date-fns"
import {
  MapPin,
  WifiOff,
  AlertCircle,
  LogOut,
  Clock,
  TrendingUp,
  Timer,
  CheckCircle2,
  PartyPopper,
  X,
  Coffee,
  Play,
  Calendar,
  Target,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Building2,
  Home,
  Flame,
  Trophy,
  Star,
  Award,
  RefreshCw,
  Phone,
  Palmtree,
  BarChart3,
  Settings,
  Bell,
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

// Live timer component
function LiveTimer({ startTime, isOnBreak }: { startTime: Date | null; isOnBreak?: boolean }) {
  const { elapsed, formatted } = useTimer(startTime)

  if (!startTime) {
    return (
      <div className="text-center">
        <p className="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight text-foreground/20">
          00:00:00
        </p>
        <p className="text-sm text-muted-foreground mt-2">Ready to start</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className={cn(
        "text-6xl sm:text-7xl font-bold tabular-nums tracking-tight transition-colors",
        isOnBreak ? "text-amber-500" : "text-foreground"
      )}>
        {formatted}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        {isOnBreak ? "On Break" : "Current Session"}
      </p>
    </div>
  )
}

// Live XP widget
function LiveXPWidget() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-500/25">
            {level}
          </div>
          <div>
            <p className="font-semibold">Level {level}</p>
            <p className="text-xs text-muted-foreground">{totalXP.toLocaleString()} XP total</p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-500">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-bold">{currentStreak}</span>
          </div>
        )}
      </div>

      {/* XP Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress to Level {level + 1}</span>
          <span className="text-amber-500 font-medium">{xpToNext} XP to go</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Session XP */}
      {sessionXP > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-500"
        >
          <Sparkles className="h-4 w-4" />
          <span>+{sessionXP} XP this session</span>
        </motion.div>
      )}

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Recent Badges</p>
          <div className="flex gap-2">
            {recentBadges.slice(0, 4).map((badge) => (
              <div
                key={badge}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg"
                title={badge}
              >
                {getBadgeEmoji(badge)}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/rewards"
        className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        View all rewards
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

function getBadgeEmoji(badge: string): string {
  const badges: Record<string, string> = {
    early_bird: "🐦",
    night_owl: "🦉",
    streak_7: "🔥",
    streak_30: "💯",
    century: "💯",
    perfect_week: "⭐",
    iron_will: "💪",
  }
  return badges[badge] || "🏆"
}

export default function Dashboard() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  const { position, loading: gpsLoading, refresh: refreshGps } = useGeolocation(true)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)

  const clock = useClockState(position, !authLoading && !!user)
  const { refresh: refreshRealtime } = useRealtime()
  const { daysWorked, requiredDays, isCompliant, compliancePercent, weeklyHours } = useLiveCompliance()

  // Check if photo verification feature is enabled for the org
  const [orgFeatures, setOrgFeatures] = useState<Record<string, boolean>>({})
  useEffect(() => {
    fetch("/api/org/features")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setOrgFeatures(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

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

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      clock.handleRefresh(refreshGps),
      refreshRealtime(),
    ])
  }, [clock, refreshGps, refreshRealtime])

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
  const todayProgress = Math.min(100, (todayHours / 8) * 100)
  const entries = clock.currentStatus?.todayEntries || []
  const displayedEntries = showAllEntries ? entries : entries.slice(0, 3)
  const LocationIcon = getLocationIcon(clock.selectedLocation?.category)
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"

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

  return (
    <ErrorBoundary>
      {/* Photo Capture Overlay */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
          {/* Hero Header - Dark Theme like Landing Page */}
          <header className="relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-foreground" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Top bar */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <LogoMark className="w-9 h-9 rounded-xl" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-background">{getGreeting()}</p>
                    <p className="text-xs text-background/60 capitalize">{firstName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <AnimatePresence>
                    {clock.isOffline && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium mr-2"
                      >
                        <WifiOff className="h-3 w-3" />
                        <span>Offline</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <NotificationCenter />
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={clock.refreshing}
                    className="rounded-xl text-background/70 hover:text-background hover:bg-background/10"
                  >
                    <RefreshCw className={cn("h-5 w-5", clock.refreshing && "animate-spin")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="rounded-xl text-background/70 hover:text-background hover:bg-background/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center pt-4 pb-2">
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                  clock.currentStatus?.isClockedIn
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-background/10 text-background/60"
                )}>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    clock.currentStatus?.isClockedIn ? "bg-emerald-400 animate-pulse" : "bg-background/40"
                  )} />
                  {clock.currentStatus?.isClockedIn ? "Currently Working" : "Not Clocked In"}
                  {clock.currentStatus?.isClockedIn && clock.selectedLocation && (
                    <span className="text-background/40">at {clock.selectedLocation.name}</span>
                  )}
                </div>
              </div>

              {/* Timer Display */}
              <div className="py-8 text-background">
                <LiveTimer
                  startTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null}
                  isOnBreak={clock.isOnBreak}
                />
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-4 pb-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-background tabular-nums">{todayHours}h {todayMinutes}m</p>
                  <p className="text-xs text-background/50">Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-background tabular-nums">{weeklyHours}h</p>
                  <p className="text-xs text-background/50">This Week</p>
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-2xl font-bold tabular-nums",
                    isCompliant ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {daysWorked}/{requiredDays}
                  </p>
                  <p className="text-xs text-background/50">Days On-Site</p>
                </div>
              </div>
            </div>
          </header>

          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 space-y-6">
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

            {/* Clock Action Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl bg-card border border-border shadow-xl overflow-hidden"
            >
              <div className="p-5 sm:p-6 space-y-4">
                {/* Location Picker */}
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs",
                    clock.isWithinGeofence
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{formatDistance(clock.distanceToSelected)} away</span>
                    {clock.isWithinGeofence && <CheckCircle2 className="h-3.5 w-3.5 ml-1" />}
                  </div>
                )}

                {/* Clock Button */}
                <ClockButton
                  isClockedIn={clock.currentStatus?.isClockedIn || false}
                  onClockIn={handleClockInWithPhoto}
                  onClockOut={clock.handleClockOut}
                  disabled={!clock.selectedLocationId || !position || !clock.isWithinGeofence}
                />

                {/* Break buttons */}
                {clock.currentStatus?.isClockedIn && (
                  <div className="pt-2">
                    {clock.isOnBreak ? (
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={clock.handleBreakEnd}
                      >
                        <Play className="h-4 w-4" />
                        End Break
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
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

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {/* Today's Hours */}
                  <div className="rounded-xl bg-card border border-border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      {todayProgress >= 100 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{todayHours}h {todayMinutes}m</p>
                    <p className="text-xs text-muted-foreground mt-1">Today</p>
                    <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${todayProgress}%` }} />
                    </div>
                  </div>

                  {/* Week Hours */}
                  <div className="rounded-xl bg-card border border-border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <Calendar className="h-4 w-4 text-violet-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{weeklyHours}h</p>
                    <p className="text-xs text-muted-foreground mt-1">This Week</p>
                    <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${Math.min(100, (weeklyHours / 40) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Days On-Site */}
                  <div className="rounded-xl bg-card border border-border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Target className="h-4 w-4 text-emerald-500" />
                      </div>
                      {isCompliant && <Sparkles className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-2xl font-bold tabular-nums">
                      {daysWorked}<span className="text-base font-normal text-muted-foreground">/{requiredDays}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Days On-Site</p>
                    <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", isCompliant ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${compliancePercent}%` }} />
                    </div>
                  </div>

                  {/* Entries Today */}
                  <div className="rounded-xl bg-card border border-border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Zap className="h-4 w-4 text-orange-500" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{entries.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Entries Today</p>
                    <div className="mt-3 flex gap-1">
                      {entries.slice(0, 4).map((entry, i) => (
                        <div key={i} className={cn("flex-1 h-1 rounded-full", entry.type === "CLOCK_IN" ? "bg-emerald-500" : "bg-rose-500")} />
                      ))}
                      {entries.length === 0 && <div className="flex-1 h-1 rounded-full bg-muted" />}
                    </div>
                  </div>
                </motion.div>

                {/* Weekly Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-xl bg-card border border-border p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Weekly Overview</h2>
                    <Link href="/app/history" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      View History <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {clock.weekSummary?.weekDays?.map((day, i) => {
                      const hours = Math.floor((day.minutes || 0) / 60)
                      const mins = (day.minutes || 0) % 60
                      const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                      const isWeekend = i === 0 || i === 6
                      return (
                        <div key={day.date} className={cn("flex flex-col items-center py-3 rounded-xl transition-colors", isToday ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50", isWeekend && "opacity-50")}>
                          <span className={cn("text-[10px] uppercase tracking-wider mb-2", isToday ? "text-primary font-medium" : "text-muted-foreground")}>{day.dayOfWeek.slice(0, 3)}</span>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2", day.worked ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                            {day.worked ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{new Date(day.date).getDate()}</span>}
                          </div>
                          <span className={cn("text-xs tabular-nums", day.minutes > 0 ? "text-foreground" : "text-muted-foreground/50")}>
                            {day.minutes > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : "-"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* XP Widget */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                  <LiveXPWidget />
                </motion.div>

                {/* Today's Activity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <h2 className="font-semibold">Today's Activity</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">{entries.length} entries</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {displayedEntries.length > 0 ? (
                      displayedEntries.map((entry, index) => {
                        const isClockIn = entry.type === "CLOCK_IN"
                        const time = new Date(entry.timestampServer)
                        return (
                          <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isClockIn ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                              {isClockIn ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{isClockIn ? "Clocked In" : "Clocked Out"}</p>
                              <p className="text-xs text-muted-foreground truncate">{entry.location?.name || "Unknown location"}</p>
                            </div>
                            <span className="text-sm text-muted-foreground tabular-nums">{formatTime(time)}</span>
                          </motion.div>
                        )
                      })
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center"><Clock className="h-5 w-5 text-muted-foreground/50" /></div>
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Clock in to get started</p>
                      </div>
                    )}
                  </div>
                  {entries.length > 3 && (
                    <button onClick={() => setShowAllEntries(!showAllEntries)} className="w-full px-5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 border-t border-border/50">
                      {showAllEntries ? "Show less" : `Show ${entries.length - 3} more`}
                      <ChevronRight className={cn("h-3 w-3 transition-transform", showAllEntries && "rotate-90")} />
                    </button>
                  )}
                </motion.div>

                {/* Quick Links */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="grid grid-cols-2 gap-3">
                  {[
                    { href: "/app/history", icon: Calendar, label: "History" },
                    { href: "/app/reports", icon: BarChart3, label: "Reports" },
                    { href: "/app/leave", icon: Palmtree, label: "Leave" },
                    { href: "/app/settings", icon: Settings, label: "Settings" },
                  ].map((link) => (
                    <Link key={link.href} href={link.href} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors">
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-medium">{link.label}</span>
                    </Link>
                  ))}
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </PullToRefresh>
    </ErrorBoundary>
  )
}
