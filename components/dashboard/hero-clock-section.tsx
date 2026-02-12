"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LocationPicker } from "@/components/location-picker"
import { MobileClockTimer } from "@/components/dashboard/mobile-clock-timer"
import { BreakActions, QuickActionsBar, getDefaultQuickActions } from "@/components/dashboard/quick-actions"
import { GeoPosition } from "@/lib/geo"
import { fadeUp } from "@/lib/animations"
import { MapPin, ChevronRight, PartyPopper, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroClockSectionProps {
  clock: any
  position: GeoPosition | null
  gpsLoading: boolean
  refreshGps: () => void
  onClockIn: () => Promise<void>
  isOvertime: boolean
  eightHourAlert: boolean
  onDismissAlert: () => void
}

export function HeroClockSection({
  clock,
  position,
  gpsLoading,
  refreshGps,
  onClockIn,
  eightHourAlert,
  onDismissAlert,
}: HeroClockSectionProps) {
  const sessionStart = clock.currentStatus?.currentSessionStart
    ? new Date(clock.currentStatus.currentSessionStart)
    : null
  const isClockedIn = clock.currentStatus?.isClockedIn || false
  const clockDisabled = !isClockedIn && (!clock.selectedLocationId || !position || !clock.isWithinGeofence)

  return (
    <>
      {/* 8-Hour Achievement */}
      <AnimatePresence>
        {eightHourAlert && (
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
              onClick={onDismissAlert}
              className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Mobile: Interactive Timer (tap to clock in, hold to clock out) */}
        <div className="flex justify-center py-4 lg:hidden">
          <MobileClockTimer
            startTime={sessionStart}
            isOnBreak={clock.isOnBreak}
            isClockedIn={isClockedIn}
            targetHours={8}
            onClockIn={onClockIn}
            onClockOut={clock.handleClockOut}
            disabled={clockDisabled}
          />
        </div>

        {/* Desktop: Live Timer moved to DesktopClockBar */}

        {/* Location Selection (mobile only — desktop uses DesktopClockBar) */}
        <div className="lg:hidden">
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
            />
          ) : null}
        </div>

        {/* Desktop: Giant Clock Button moved to DesktopClockBar */}

        {/* Break Actions (mobile only — desktop uses DesktopClockBar) */}
        {isClockedIn && (
          <BreakActions
            isOnBreak={clock.isOnBreak}
            onStartBreak={clock.handleBreakStart}
            onEndBreak={clock.handleBreakEnd}
            className="lg:hidden"
          />
        )}

        {/* Quick Actions */}
        <QuickActionsBar
          actions={getDefaultQuickActions({
            isClockedIn,
            onStartBreak: clock.handleBreakStart,
            onEndBreak: clock.handleBreakEnd,
            isOnBreak: clock.isOnBreak,
          })}
          layout="horizontal"
          size="md"
        />
      </motion.section>
    </>
  )
}
