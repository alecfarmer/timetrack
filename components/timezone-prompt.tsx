"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe, Clock, AlertTriangle, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getTimezone,
  detectUserTimezone,
  setTimezoneOverride,
  getTimezoneOverride,
} from "@/lib/dates"

// Common timezones for the dropdown
const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "America/Vancouver", label: "Vancouver (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
]

const STORAGE_KEY = "onsite-timezone-prompt-dismissed"

export function TimezonePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [detectedTz, setDetectedTz] = useState<string | null>(null)
  const [savedTz, setSavedTz] = useState<string | null>(null)
  const [selectedTz, setSelectedTz] = useState<string>("")

  useEffect(() => {
    // Check for timezone mismatch
    const detected = detectUserTimezone()
    const override = getTimezoneOverride()
    const lastDismissed = localStorage.getItem(STORAGE_KEY)

    setDetectedTz(detected)
    setSavedTz(override)

    // Show prompt if:
    // 1. There's an override that doesn't match detected
    // 2. User hasn't dismissed the prompt today
    if (override && override !== detected) {
      const today = new Date().toDateString()
      if (lastDismissed !== today) {
        setShowPrompt(true)
        setSelectedTz(detected)
      }
    }
  }, [])

  const handleUseDetected = () => {
    if (detectedTz) {
      setTimezoneOverride(detectedTz)
      setShowPrompt(false)
      // Refresh to apply new timezone
      window.location.reload()
    }
  }

  const handleKeepCurrent = () => {
    // Dismiss for today
    localStorage.setItem(STORAGE_KEY, new Date().toDateString())
    setShowPrompt(false)
  }

  const handleSelectTimezone = (tz: string) => {
    setSelectedTz(tz)
  }

  const handleApplySelected = () => {
    if (selectedTz) {
      setTimezoneOverride(selectedTz)
      setShowPrompt(false)
      window.location.reload()
    }
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Header gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <div className="p-6">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center mb-2">
              Timezone Mismatch Detected
            </h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-6">
              Your saved timezone doesn't match your current location. Would you like to update it?
            </p>

            {/* Timezone comparison */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Current Setting</p>
                  <p className="font-medium">{savedTz}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Detected Location</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{detectedTz}</p>
                </div>
              </div>
            </div>

            {/* Or select manually */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">Or select a different timezone:</p>
              <Select value={selectedTz} onValueChange={handleSelectTimezone}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUseDetected}
                className="w-full rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              >
                <Check className="h-4 w-4" />
                Use Detected ({detectedTz?.split("/").pop()})
              </Button>

              {selectedTz && selectedTz !== detectedTz && (
                <Button
                  onClick={handleApplySelected}
                  variant="outline"
                  className="w-full rounded-xl h-11 gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Use Selected ({selectedTz.split("/").pop()})
                </Button>
              )}

              <Button
                onClick={handleKeepCurrent}
                variant="ghost"
                className="w-full rounded-xl h-11 text-muted-foreground"
              >
                Keep Current Setting
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Timezone selector for settings page
export function TimezoneSelector({
  value,
  onChange,
  className,
}: {
  value?: string
  onChange: (tz: string) => void
  className?: string
}) {
  const [currentTz, setCurrentTz] = useState(value || getTimezone())
  const detectedTz = detectUserTimezone()

  useEffect(() => {
    if (value) setCurrentTz(value)
  }, [value])

  const handleChange = (tz: string) => {
    setCurrentTz(tz)
    onChange(tz)
  }

  const handleUseDetected = () => {
    handleChange(detectedTz)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Select value={currentTz} onValueChange={handleChange}>
          <SelectTrigger className="flex-1 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentTz !== detectedTz && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseDetected}
            className="rounded-xl gap-1.5 text-xs"
          >
            <Globe className="h-3.5 w-3.5" />
            Use Detected
          </Button>
        )}
      </div>

      {currentTz !== detectedTz && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Your browser detected: {detectedTz}
        </p>
      )}
    </div>
  )
}
