"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoMark } from "@/components/logo"
import { Onboarding } from "@/components/onboarding"
import { OfflineBanner } from "@/components/offline-banner"
import { ErrorBoundary } from "@/components/error-boundary"
import { NotificationCenter } from "@/components/notification-center"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { Widget } from "@/components/dashboard/widget-grid"
import { useGamificationModals } from "@/components/gamification/level-up-modal"
import { HeroClockSection } from "@/components/dashboard/hero-clock-section"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { XPWidget } from "@/components/dashboard/xp-widget"
import { WeeklyOverviewWidget } from "@/components/dashboard/weekly-overview-widget"
import { TodaysActivityWidget } from "@/components/dashboard/todays-activity-widget"
import { Button } from "@/components/ui/button"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useClockState } from "@/hooks/use-clock-state"
import { useRealtime, useLiveCompliance } from "@/contexts/realtime-context"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import {
  WifiOff,
  AlertCircle,
  LogOut,
  Calendar,
  Coffee,
  Target,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PhotoCapture = dynamic(() => import("@/components/photo-capture").then(m => ({ default: m.PhotoCapture })), { ssr: false })
const LevelUpModal = dynamic(() => import("@/components/gamification/level-up-modal").then(m => ({ default: m.LevelUpModal })), { ssr: false })
const BadgeUnlockModal = dynamic(() => import("@/components/gamification/level-up-modal").then(m => ({ default: m.BadgeUnlockModal })), { ssr: false })
const StreakMilestoneModal = dynamic(() => import("@/components/gamification/level-up-modal").then(m => ({ default: m.StreakMilestoneModal })), { ssr: false })
const XPGainToast = dynamic(() => import("@/components/gamification/level-up-modal").then(m => ({ default: m.XPGainToast })), { ssr: false })

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
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
  const isOvertime = todayHours >= 8

  return (
    <ErrorBoundary>
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
        />
      )}

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

            <StatsGrid
              todayHours={todayHours}
              todayMinutes={todayMinutes}
              todayProgress={todayProgress}
              weeklyHours={weeklyHours}
              daysWorked={daysWorked}
              requiredDays={requiredDays}
              compliancePercent={compliancePercent}
              isCompliant={isCompliant}
              entryCount={entries.length}
            />

            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <WeeklyOverviewWidget weekSummary={clock.weekSummary} />
                </motion.div>

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

              <div className="lg:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <XPWidget />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Widget title="Quick Links">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { href: "/history", icon: Calendar, label: "History", color: "text-violet-500" },
                        { href: "/reports", icon: TrendingUp, label: "Reports", color: "text-blue-500" },
                        { href: "/leave", icon: Coffee, label: "Leave", color: "text-emerald-500" },
                        { href: "/settings", icon: Target, label: "Settings", color: "text-amber-500" },
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
