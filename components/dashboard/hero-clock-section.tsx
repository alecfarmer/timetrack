"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ClockButton } from "@/components/clock-button"
import { LocationPicker } from "@/components/location-picker"
import { LiveTimer } from "@/components/dashboard/live-timer"
import { BreakActions, QuickActionsBar, getDefaultQuickActions } from "@/components/dashboard/quick-actions"
import { formatDistance, GeoPosition } from "@/lib/geo"
import { fadeUp } from "@/lib/animations"
import { MapPin, CheckCircle2, ChevronRight, PartyPopper, X } from "lucide-react"
import { cn } from "@/lib/utils"
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
  isOvertime,
  eightHourAlert,
  onDismissAlert,
}: HeroClockSectionProps) {
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
          onClockIn={onClockIn}
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
    </>
  )
}
