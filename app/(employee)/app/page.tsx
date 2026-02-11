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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useTimer } from "@/hooks/use-timer"
import { useRealtime, useLiveXP, useLiveCompliance } from "@/contexts/realtime-context"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance } from "@/lib/geo"
import { formatTime } from "@/lib/dates"
import { format } from "date-fns"
import {
  MapPin,
  WifiOff,
  AlertCircle,
  LogOut,
  Clock,
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
  RefreshCw,
  Palmtree,
  BarChart3,
  Settings,
  TrendingUp,
  Award,
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
  const { formatted } = useTimer(startTime)

  return (
    <div className="text-center">
      <p className={cn(
        "text-5xl sm:text-6xl font-bold tabular-nums tracking-tight transition-colors",
        !startTime && "text-muted-foreground/30",
        isOnBreak && "text-amber-500"
      )}>
        {startTime ? formatted : "00:00:00"}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        {!startTime ? "Ready to start" : isOnBreak ? "On Break" : "Current Session"}
      </p>
    </div>
  )
}

// XP Progress widget
function XPWidget() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Progress & Rewards
          </CardTitle>
          {currentStreak > 0 && (
            <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
              <Flame className="h-3 w-3" />
              {currentStreak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/25">
            {level}
          </div>
          <div className="flex-1">
            <p className="font-semibold">Level {level}</p>
            <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} XP total</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="font-medium text-amber-600">{xpToNext} XP to go</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
        </div>

        {sessionXP > 0 && (
          <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">+{sessionXP} XP this session</span>
          </div>
        )}

        {recentBadges.length > 0 && (
          <div className="pt-2 border-t">
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
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
        >
          View all rewards
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
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

// Stat card component
function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subvalue,
  progress,
  progressColor,
  indicator,
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
  subvalue?: string
  progress?: number
  progressColor?: string
  indicator?: React.ReactNode
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2 rounded-lg", iconColor.replace("text-", "bg-").replace("-500", "-500/10"))}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          {indicator}
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {subvalue && <p className="text-xs text-muted-foreground">{subvalue}</p>}
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className={cn("h-1.5", progressColor)} />
          </div>
        )}
      </CardContent>
    </Card>
  )
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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const todayHours = Math.floor((clock.currentStatus?.totalMinutesToday || 0) / 60)
  const todayMinutes = (clock.currentStatus?.totalMinutesToday || 0) % 60
  const todayProgress = Math.min(100, (todayHours / 8) * 100)
  const entries = clock.currentStatus?.todayEntries || []
  const displayedEntries = showAllEntries ? entries : entries.slice(0, 3)
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

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center gap-3">
                  <LogoMark className="w-8 h-8 rounded-lg" />
                  <div>
                    <p className="text-sm font-medium">{getGreeting()}, {firstName}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <AnimatePresence>
                    {clock.isOffline && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium mr-2"
                      >
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={clock.refreshing}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={cn("h-4 w-4", clock.refreshing && "animate-spin")} />
                  </Button>
                  <NotificationCenter />
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-8 w-8"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <OfflineBanner onSyncComplete={() => Promise.all([clock.fetchCurrentStatus(), clock.fetchWeekSummary()])} />

            {/* Error Banner */}
            <AnimatePresence>
              {clock.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{clock.error}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => clock.setError(null)}>
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
                  className="flex items-center gap-4 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">8-Hour Workday Complete</p>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">Great work today!</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => clock.setEightHourAlert(false)}
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clock Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-center mb-6">
                    <Badge
                      variant={clock.currentStatus?.isClockedIn ? "default" : "secondary"}
                      className={cn(
                        "px-4 py-1.5 text-sm gap-2",
                        clock.currentStatus?.isClockedIn && "bg-emerald-500 hover:bg-emerald-500"
                      )}
                    >
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        clock.currentStatus?.isClockedIn ? "bg-white animate-pulse" : "bg-muted-foreground"
                      )} />
                      {clock.currentStatus?.isClockedIn ? "Currently Working" : "Not Clocked In"}
                    </Badge>
                  </div>

                  {/* Timer */}
                  <div className="py-6">
                    <LiveTimer
                      startTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null}
                      isOnBreak={clock.isOnBreak}
                    />
                  </div>

                  {/* Location Picker */}
                  <div className="space-y-4 pt-4 border-t">
                    {!position && !gpsLoading ? (
                      <button
                        onClick={refreshGps}
                        className="w-full flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">Enable Location</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : gpsLoading ? (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
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
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        clock.isWithinGeofence
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <MapPin className="h-4 w-4" />
                        <span>{formatDistance(clock.distanceToSelected)} away</span>
                        {clock.isWithinGeofence && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                      </div>
                    )}

                    {/* Clock Button */}
                    <ClockButton
                      isClockedIn={clock.currentStatus?.isClockedIn || false}
                      onClockIn={handleClockInWithPhoto}
                      onClockOut={clock.handleClockOut}
                      disabled={!clock.currentStatus?.isClockedIn && (!clock.selectedLocationId || !position || !clock.isWithinGeofence)}
                      variant="modern"
                    />

                    {/* Break buttons */}
                    {clock.currentStatus?.isClockedIn && (
                      <div className="pt-2">
                        {clock.isOnBreak ? (
                          <Button
                            variant="outline"
                            className="w-full gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={clock.handleBreakEnd}
                          >
                            <Play className="h-4 w-4" />
                            End Break
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={clock.handleBreakStart}
                          >
                            <Coffee className="h-4 w-4" />
                            Start Break
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <StatCard
                icon={Clock}
                iconColor="text-blue-500"
                label="Today"
                value={`${todayHours}h ${todayMinutes}m`}
                progress={todayProgress}
                indicator={todayProgress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : undefined}
              />
              <StatCard
                icon={Calendar}
                iconColor="text-violet-500"
                label="This Week"
                value={`${weeklyHours}h`}
                progress={Math.min(100, (weeklyHours / 40) * 100)}
              />
              <StatCard
                icon={Target}
                iconColor="text-emerald-500"
                label="Days On-Site"
                value={`${daysWorked}/${requiredDays}`}
                progress={compliancePercent}
                indicator={isCompliant ? <Sparkles className="h-4 w-4 text-emerald-500" /> : undefined}
              />
              <StatCard
                icon={Zap}
                iconColor="text-orange-500"
                label="Entries Today"
                value={entries.length.toString()}
              />
            </motion.div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left Column - Main content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Weekly Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">Weekly Overview</CardTitle>
                        <Link href="/app/history" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                          View History <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                                "flex flex-col items-center py-3 rounded-lg transition-colors",
                                isToday && "bg-primary/10 ring-1 ring-primary/20",
                                !isToday && "hover:bg-muted/50",
                                isWeekend && "opacity-60"
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
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Today's Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">Today's Activity</CardTitle>
                        <Badge variant="secondary">{entries.length} entries</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {displayedEntries.length > 0 ? (
                          displayedEntries.map((entry, index) => {
                            const isClockIn = entry.type === "CLOCK_IN"
                            const isBreak = entry.type === "BREAK_START" || entry.type === "BREAK_END"
                            const time = new Date(entry.timestampServer)
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  isBreak
                                    ? "bg-amber-500/10 text-amber-600"
                                    : isClockIn
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-rose-500/10 text-rose-600"
                                )}>
                                  {isBreak ? (
                                    <Coffee className="h-4 w-4" />
                                  ) : isClockIn ? (
                                    <ArrowDownRight className="h-4 w-4" />
                                  ) : (
                                    <ArrowUpRight className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">
                                    {isBreak
                                      ? (entry.type === "BREAK_START" ? "Break Started" : "Break Ended")
                                      : isClockIn ? "Clocked In" : "Clocked Out"}
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
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">No activity yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Clock in to get started</p>
                          </div>
                        )}
                      </div>
                      {entries.length > 3 && (
                        <button
                          onClick={() => setShowAllEntries(!showAllEntries)}
                          className="w-full px-6 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 border-t"
                        >
                          {showAllEntries ? "Show less" : `Show ${entries.length - 3} more`}
                          <ChevronRight className={cn("h-4 w-4 transition-transform", showAllEntries && "rotate-90")} />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-2 space-y-6">
                {/* XP Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <XPWidget />
                </motion.div>

                {/* Quick Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      {[
                        { href: "/app/history", icon: Calendar, label: "History" },
                        { href: "/app/reports", icon: BarChart3, label: "Reports" },
                        { href: "/app/leave", icon: Palmtree, label: "Leave" },
                        { href: "/app/settings", icon: Settings, label: "Settings" },
                      ].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <link.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{link.label}</span>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </PullToRefresh>
    </ErrorBoundary>
  )
}
