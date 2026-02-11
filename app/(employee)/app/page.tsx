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
import { LiveTimer } from "@/components/dashboard/live-timer"
import { Widget, StatWidget, ActivityWidget } from "@/components/dashboard/widget-grid"
import { QuickActionsBar, BreakActions, getDefaultQuickActions } from "@/components/dashboard/quick-actions"
import {
  LevelUpModal,
  BadgeUnlockModal,
  StreakMilestoneModal,
  XPGainToast,
  useGamificationModals,
} from "@/components/gamification/level-up-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useRealtime, useLiveXP, useLiveCompliance } from "@/contexts/realtime-context"
import { useAuth } from "@/contexts/auth-context"
import { formatDistance } from "@/lib/geo"
import { formatTime } from "@/lib/dates"
import { format } from "date-fns"
import { staggerContainer, staggerChild, fadeUp } from "@/lib/animations"
import {
  MapPin,
  WifiOff,
  AlertCircle,
  LogOut,
  Clock,
  CheckCircle2,
  PartyPopper,
  X,
  Coffee,
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
  Award,
  TrendingUp,
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

// XP Progress widget
function XPWidget() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()

  return (
    <Widget
      title="Progress & Rewards"
      icon={<Award className="h-4 w-4 text-amber-500" />}
      action={{ label: "View all", href: "/rewards" }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            {level}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Level {level}</p>
              {currentStreak > 0 && (
                <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20">
                  <Flame className="h-3 w-3" />
                  {currentStreak}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} XP</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next level</span>
            <span className="font-medium text-amber-600">{xpToNext} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
        </div>

        {sessionXP > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-600"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">+{sessionXP} XP this session</span>
          </motion.div>
        )}

        {recentBadges.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Recent Badges</p>
            <div className="flex gap-2">
              {recentBadges.slice(0, 4).map((badge, i) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg"
                  title={badge}
                >
                  {getBadgeEmoji(badge)}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Widget>
  )
}

// Weekly Overview widget
function WeeklyOverviewWidget({ weekSummary }: { weekSummary: any }) {
  return (
    <Widget
      title="Weekly Overview"
      icon={<Calendar className="h-4 w-4 text-violet-500" />}
      action={{ label: "View History", href: "/app/history" }}
    >
      <div className="grid grid-cols-7 gap-2">
        {weekSummary?.weekDays?.map((day: any, i: number) => {
          const hours = Math.floor((day.minutes || 0) / 60)
          const mins = (day.minutes || 0) % 60
          const isToday = day.date === format(new Date(), "yyyy-MM-dd")
          const isWeekend = i === 0 || i === 6
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
            </motion.div>
          )
        })}
      </div>
    </Widget>
  )
}

// Today's Activity widget
function TodaysActivityWidget({ entries, showAll, setShowAll }: { entries: any[]; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const displayedEntries = showAll ? entries : entries.slice(0, 3)

  const activityItems = displayedEntries.map((entry: any) => {
    const isClockIn = entry.type === "CLOCK_IN"
    const isBreak = entry.type === "BREAK_START" || entry.type === "BREAK_END"
    return {
      id: entry.id,
      icon: isBreak ? (
        <Coffee className="h-4 w-4" />
      ) : isClockIn ? (
        <ArrowDownRight className="h-4 w-4" />
      ) : (
        <ArrowUpRight className="h-4 w-4" />
      ),
      iconColor: isBreak
        ? "bg-amber-500/10 text-amber-600"
        : isClockIn
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-rose-500/10 text-rose-600",
      title: isBreak
        ? (entry.type === "BREAK_START" ? "Break Started" : "Break Ended")
        : isClockIn ? "Clocked In" : "Clocked Out",
      subtitle: entry.location?.name || "Unknown location",
      timestamp: formatTime(new Date(entry.timestampServer)),
    }
  })

  return (
    <Widget
      title="Today's Activity"
      icon={<Clock className="h-4 w-4 text-blue-500" />}
      action={entries.length > 0 ? { label: `${entries.length} entries` } : undefined}
      noPadding
    >
      {activityItems.length > 0 ? (
        <ActivityWidget
          items={activityItems}
          maxItems={3}
          showAll={showAll}
          onShowAll={() => setShowAll(!showAll)}
        />
      ) : (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">Clock in to get started</p>
        </div>
      )}
    </Widget>
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

  // Gamification modals
  const gamification = useGamificationModals()

  // Check if photo verification feature is enabled
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
    // Trigger XP gain on successful clock in
    gamification.addXPGain(10, "Clock in bonus")
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
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"

  // Check if in overtime (more than 8 hours)
  const isOvertime = todayHours >= 8

  return (
    <ErrorBoundary>
      {/* Photo Capture Overlay */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

      {/* Gamification Modals */}
      <LevelUpModal
        isOpen={gamification.state.showLevelUp}
        onClose={gamification.closeLevelUp}
        level={gamification.state.levelUpData?.level || 1}
        totalXP={gamification.state.levelUpData?.totalXP || 0}
        unlockedRewards={gamification.state.levelUpData?.rewards}
      />
      <BadgeUnlockModal
        isOpen={gamification.state.showBadgeUnlock}
        onClose={gamification.closeBadgeUnlock}
        badge={gamification.state.badgeData}
      />
      <StreakMilestoneModal
        isOpen={gamification.state.showStreakMilestone}
        onClose={gamification.closeStreakMilestone}
        streakDays={gamification.state.streakData?.days || 0}
        xpBonus={gamification.state.streakData?.xpBonus || 0}
      />

      {/* XP Gain Toasts */}
      <div className="fixed bottom-28 right-4 z-50 space-y-2">
        <AnimatePresence>
          {gamification.state.xpGains.map((gain) => (
            <XPGainToast
              key={gain.id}
              amount={gain.amount}
              reason={gain.reason}
              onComplete={() => gamification.removeXPGain(gain.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

            {/* Hero Clock Section */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Live Timer */}
              <div className="flex justify-center py-4">
                <LiveTimer
                  startTime={clock.currentStatus?.currentSessionStart ? new Date(clock.currentStatus.currentSessionStart) : null}
                  isOnBreak={clock.isOnBreak}
                  targetHours={8}
                  showProgress={true}
                  size="xl"
                />
              </div>

              {/* Location Selection */}
              {!position && !gpsLoading ? (
                <button
                  onClick={refreshGps}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Enable Location</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : gpsLoading ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
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
                  "flex items-center gap-2 px-4 py-3 rounded-xl text-sm",
                  clock.isWithinGeofence
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}>
                  <MapPin className="h-4 w-4" />
                  <span>{formatDistance(clock.distanceToSelected)} from {clock.selectedLocation.name}</span>
                  {clock.isWithinGeofence && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                </div>
              )}

              {/* Giant Clock Button */}
              <ClockButton
                isClockedIn={clock.currentStatus?.isClockedIn || false}
                onClockIn={handleClockInWithPhoto}
                onClockOut={clock.handleClockOut}
                disabled={!clock.currentStatus?.isClockedIn && (!clock.selectedLocationId || !position || !clock.isWithinGeofence)}
                variant="giant"
                isOnBreak={clock.isOnBreak}
                isOvertime={isOvertime}
              />

              {/* Break Actions */}
              {clock.currentStatus?.isClockedIn && (
                <BreakActions
                  isOnBreak={clock.isOnBreak}
                  onStartBreak={clock.handleBreakStart}
                  onEndBreak={clock.handleBreakEnd}
                />
              )}

              {/* Quick Actions */}
              <QuickActionsBar
                actions={getDefaultQuickActions({
                  isClockedIn: clock.currentStatus?.isClockedIn || false,
                  onStartBreak: clock.handleBreakStart,
                  onEndBreak: clock.handleBreakEnd,
                  isOnBreak: clock.isOnBreak,
                })}
                layout="horizontal"
                size="md"
              />
            </motion.section>

            {/* Stats Grid */}
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <motion.div variants={staggerChild}>
                <StatWidget
                  icon={<Clock className="h-4 w-4 text-blue-500" />}
                  iconColor="bg-blue-500/10"
                  label="Today"
                  value={`${todayHours}h ${todayMinutes}m`}
                  progress={todayProgress}
                  progressColor="bg-blue-500"
                  indicator={todayProgress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : undefined}
                />
              </motion.div>
              <motion.div variants={staggerChild}>
                <StatWidget
                  icon={<Calendar className="h-4 w-4 text-violet-500" />}
                  iconColor="bg-violet-500/10"
                  label="This Week"
                  value={`${weeklyHours}h`}
                  progress={Math.min(100, (weeklyHours / 40) * 100)}
                  progressColor="bg-violet-500"
                />
              </motion.div>
              <motion.div variants={staggerChild}>
                <StatWidget
                  icon={<Target className="h-4 w-4 text-emerald-500" />}
                  iconColor="bg-emerald-500/10"
                  label="Days On-Site"
                  value={`${daysWorked}/${requiredDays}`}
                  progress={compliancePercent}
                  progressColor="bg-emerald-500"
                  indicator={isCompliant ? <Sparkles className="h-4 w-4 text-emerald-500" /> : undefined}
                />
              </motion.div>
              <motion.div variants={staggerChild}>
                <StatWidget
                  icon={<Zap className="h-4 w-4 text-amber-500" />}
                  iconColor="bg-amber-500/10"
                  label="Entries Today"
                  value={entries.length.toString()}
                />
              </motion.div>
            </motion.section>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-6">
                {/* Weekly Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <WeeklyOverviewWidget weekSummary={clock.weekSummary} />
                </motion.div>

                {/* Today's Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <TodaysActivityWidget
                    entries={entries}
                    showAll={showAllEntries}
                    setShowAll={setShowAllEntries}
                  />
                </motion.div>
              </div>

              {/* Right Column */}
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
                  <Widget title="Quick Links">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { href: "/app/history", icon: Calendar, label: "History", color: "text-violet-500" },
                        { href: "/app/reports", icon: TrendingUp, label: "Reports", color: "text-blue-500" },
                        { href: "/app/leave", icon: Coffee, label: "Leave", color: "text-emerald-500" },
                        { href: "/app/settings", icon: Target, label: "Settings", color: "text-amber-500" },
                      ].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <link.icon className={cn("h-4 w-4", link.color)} />
                          <span className="text-sm font-medium">{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  </Widget>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </PullToRefresh>
    </ErrorBoundary>
  )
}
