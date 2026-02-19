"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { ThemeToggle } from "@/components/theme-toggle"
import { Onboarding } from "@/components/onboarding"
import { OfflineBanner } from "@/components/offline-banner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationCenter } from "@/components/notification-center"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { useGamificationModals } from "@/components/gamification/level-up-modal"
import { HeroClockSection } from "@/components/dashboard/hero-clock-section"
import { DesktopClockBar } from "@/components/dashboard/desktop-clock-bar"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { XPWidget } from "@/components/dashboard/xp-widget"
import { TodaysActivityWidget } from "@/components/dashboard/todays-activity-widget"
import { PulseWidget } from "@/components/dashboard/pulse-widget"
import { InsightsWidget, CompactInsightsWidget } from "@/components/dashboard/insights-widget"
import { ProductivityWidget, CompactProductivityWidget } from "@/components/dashboard/productivity-widget"
import {
  WorkBalanceWidget,
  WellnessIndicator,
  QuickMetricsRow,
} from "@/components/dashboard/additional-widgets"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useRealtime, useLiveCompliance } from "@/contexts/realtime-context"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import {
  WifiOff,
  AlertCircle,
  Calendar,
  Target,
  RefreshCw,
  MapPin,
  Clock,
  Flame,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const PhotoCapture = dynamic(() => import("@/components/photo-capture").then(m => ({ default: m.PhotoCapture })), { ssr: false })
const RewardModal = dynamic(() => import("@/components/gamification/level-up-modal").then(m => ({ default: m.RewardModal })), { ssr: false })
const XPGainToast = dynamic(() => import("@/components/gamification/level-up-modal").then(m => ({ default: m.XPGainToast })), { ssr: false })

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, org } = useAuth()
  const { position, loading: gpsLoading, error: gpsError, refresh: refreshGps } = useGeolocation(true)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)
  const [gpsBannerDismissed, setGpsBannerDismissed] = useState(false)

  const clock = useClockState(position, !authLoading && !!user)
  const { refresh: refreshRealtime } = useRealtime()
  const { daysWorked, requiredDays, isCompliant, compliancePercent, weeklyMinutes, currentStreak } = useLiveCompliance()

  const gamification = useGamificationModals()

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
    gamification.addXPGain(10, "Clock in bonus")
  }

  const handlePhotoCapture = async (dataUrl: string) => {
    clock.setPendingPhotoUrl(dataUrl)
    setShowPhotoCapture(false)
    await clock.handleClockIn()
  }

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      clock.handleRefresh(refreshGps),
      refreshRealtime(),
    ])
  }, [clock, refreshGps, refreshRealtime])

  // Live stats: store current time in state, tick every 60s while clocked in
  const [liveNow, setLiveNow] = useState(() => Date.now())
  useEffect(() => {
    if (!clock.isClockedIn) return
    const id = setInterval(() => setLiveNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [clock.isClockedIn])

  if (clock.needsOnboarding) {
    if (!org) {
      router.push("/select-org")
      return null
    }
    return <Onboarding onComplete={clock.handleOnboardingComplete} />
  }

  if (authLoading || clock.loading) {
    return (
      <div className="flex items-center justify-center py-32 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Compute live today minutes
  const baseTodayMinutes = clock.currentStatus?.totalMinutesToday || 0
  const minutesSinceFetch = clock.isClockedIn
    ? Math.max(0, Math.floor((liveNow - clock.statusFetchedAt) / 60000))
    : 0
  const liveTodayMinutes = baseTodayMinutes + minutesSinceFetch

  // Compute live weekly hours
  const sessionStartStr = clock.currentStatus?.currentSessionStart
  const activeSessionMinutes = clock.isClockedIn && sessionStartStr
    ? Math.max(0, Math.floor((liveNow - new Date(sessionStartStr).getTime()) / 60000))
    : 0
  const liveWeeklyHours = Math.floor((weeklyMinutes + activeSessionMinutes) / 60)
  const liveWeeklyMinutesTotal = weeklyMinutes + activeSessionMinutes

  const todayHours = Math.floor(liveTodayMinutes / 60)
  const todayMinutes = liveTodayMinutes % 60
  const todayProgress = Math.min(100, (todayHours / 8) * 100)
  const entries = clock.currentStatus?.todayEntries || []
  const firstName = org?.firstName || user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"
  const isOvertime = todayHours >= 8
  const avgDailyHours = daysWorked > 0 ? Math.round((liveWeeklyMinutesTotal / 60 / daysWorked) * 10) / 10 : 0
  const overtimeHours = Math.max(0, liveWeeklyHours - 40)

  // Quick metrics for the hero section
  const quickMetrics = [
    {
      label: "Today",
      value: `${todayHours}h ${todayMinutes}m`,
      subValue: todayHours >= 8 ? "Goal reached!" : `${8 - todayHours}h to go`,
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      trend: todayHours >= 8 ? "up" as const : undefined,
      color: todayHours >= 8 ? "text-emerald-600 dark:text-emerald-400" : undefined,
    },
    {
      label: "This Week",
      value: `${liveWeeklyHours}h`,
      subValue: `${avgDailyHours}h avg/day`,
      icon: <Calendar className="h-4 w-4 text-violet-500" />,
      trend: liveWeeklyHours >= 40 ? "up" as const : undefined,
    },
    {
      label: "Compliance",
      value: `${daysWorked}/${requiredDays}`,
      subValue: isCompliant ? "On track" : `${requiredDays - daysWorked} more days`,
      icon: <Target className="h-4 w-4 text-emerald-500" />,
      trend: isCompliant ? "up" as const : "down" as const,
      color: isCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Streak",
      value: `${currentStreak}`,
      subValue: currentStreak > 0 ? `${currentStreak} day streak` : "Start today!",
      icon: <Flame className="h-4 w-4 text-orange-500" />,
      trend: currentStreak > 0 ? "up" as const : undefined,
      color: currentStreak > 0 ? "text-orange-600 dark:text-orange-400" : undefined,
    },
  ]

  return (
    <ErrorBoundary>
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

      <RewardModal
        type="level-up"
        isOpen={gamification.state.showLevelUp}
        onClose={gamification.closeLevelUp}
        level={gamification.state.levelUpData?.level || 1}
        totalXP={gamification.state.levelUpData?.totalXP || 0}
        unlockedRewards={gamification.state.levelUpData?.rewards}
      />
      <RewardModal
        type="badge"
        isOpen={gamification.state.showBadgeUnlock}
        onClose={gamification.closeBadgeUnlock}
        badge={gamification.state.badgeData}
      />
      <RewardModal
        type="streak"
        isOpen={gamification.state.showStreakMilestone}
        onClose={gamification.closeStreakMilestone}
        streakDays={gamification.state.streakData?.days || 0}
        xpBonus={gamification.state.streakData?.xpBonus || 0}
      />

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

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-background pb-24 lg:pb-8">
          {/* Desktop Header - Full width */}
          <header className="hidden lg:block sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
            <div className="max-w-[1600px] mx-auto px-6 xl:px-8">
              <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">{getGreeting()}, {firstName}</p>
                  <span className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</span>
                  {clock.isOffline && (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10">
                      <WifiOff className="h-3 w-3" />
                      Offline
                    </Badge>
                  )}
                  {clock.isClockedIn && (
                    <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Clocked In
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                </div>
              </div>
            </div>

            <DesktopClockBar
              clock={clock}
              position={position}
              gpsLoading={gpsLoading}
              refreshGps={refreshGps}
              onClockIn={handleClockInWithPhoto}
              isOvertime={isOvertime}
            />
          </header>

          {/* Main Content - Extra wide */}
          <main className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 py-6 space-y-6">
            <OfflineBanner onSyncComplete={() => Promise.all([clock.fetchCurrentStatus(), clock.fetchWeekSummary()])} />

            <AnimatePresence>
              {clock.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
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

            {/* Location permission prompt */}
            {!position && !gpsLoading && !gpsBannerDismissed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Location access required</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {gpsError === "Location permission denied"
                        ? "Location was blocked. Enable it in your browser settings to clock in."
                        : "Enable location access so you can clock in at your work sites."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="text-amber-700 dark:text-amber-300 hover:text-amber-900" onClick={() => setGpsBannerDismissed(true)}>
                    Dismiss
                  </Button>
                  {gpsError !== "Location permission denied" && (
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={refreshGps}>
                      Enable
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Mobile: Hero Clock Section */}
            <HeroClockSection
              clock={clock}
              position={position}
              gpsLoading={gpsLoading}
              refreshGps={refreshGps}
              onClockIn={handleClockInWithPhoto}
              isOvertime={isOvertime}
              eightHourAlert={clock.eightHourAlert}
              onDismissAlert={() => clock.setEightHourAlert(false)}
            />

            {/* Quick Metrics Row - Desktop only */}
            <div className="hidden lg:block">
              <QuickMetricsRow metrics={quickMetrics} />
            </div>

            {/* Mobile Stats Grid */}
            <div className="lg:hidden">
              <StatsGrid
                todayHours={todayHours}
                todayMinutes={todayMinutes}
                todayProgress={todayProgress}
                weeklyHours={liveWeeklyHours}
                daysWorked={daysWorked}
                requiredDays={requiredDays}
                compliancePercent={compliancePercent}
                isCompliant={isCompliant}
                currentStreak={currentStreak}
              />
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE LAYOUT - Stacked widgets
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4 lg:hidden">
              <XPWidget />
              <CompactProductivityWidget weekSummary={clock.weekSummary} liveSessionMinutes={activeSessionMinutes} />
              <CompactInsightsWidget weekSummary={clock.weekSummary} liveSessionMinutes={activeSessionMinutes} />
              <TodaysActivityWidget
                entries={entries}
                showAll={showAllEntries}
                setShowAll={setShowAllEntries}
              />
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP LAYOUT - Wide 3-column grid
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:block space-y-6">
              {/* Row 1: Main Analytics Widgets - Full width, side by side */}
              <div className="grid grid-cols-2 gap-6">
                <ProductivityWidget weekSummary={clock.weekSummary} liveSessionMinutes={activeSessionMinutes} />
                <InsightsWidget weekSummary={clock.weekSummary} liveSessionMinutes={activeSessionMinutes} />
              </div>

              {/* Row 2: XP/Progress + Secondary widgets */}
              <div className="grid grid-cols-3 gap-6">
                <XPWidget />
                <WorkBalanceWidget weekSummary={clock.weekSummary} />
                <WellnessIndicator
                  consecutiveWorkDays={currentStreak}
                  avgDailyHours={avgDailyHours}
                  overtimeHours={overtimeHours}
                />
              </div>

              {/* Row 3: Activity - Full width */}
              <TodaysActivityWidget
                entries={entries}
                showAll={showAllEntries}
                setShowAll={setShowAllEntries}
              />
            </div>
          </main>
        </div>
      </PullToRefresh>
    </ErrorBoundary>
  )
}
