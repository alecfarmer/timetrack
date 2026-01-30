"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTimeWithZone, formatRelative } from "@/lib/dates"
import { getAccuracyLevel } from "@/lib/geo"
import { LogIn, LogOut, MapPin, AlertCircle, Coffee, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface EntryCardProps {
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"
  timestamp: Date | string
  locationName: string
  gpsAccuracy?: number | null
  notes?: string | null
  onClick?: () => void
  index?: number
}

export function EntryCard({
  type,
  timestamp,
  locationName,
  gpsAccuracy,
  notes,
  onClick,
  index = 0,
}: EntryCardProps) {
  const isClockIn = type === "CLOCK_IN"
  const isBreakStart = type === "BREAK_START"
  const isBreakEnd = type === "BREAK_END"
  const isPositive = isClockIn || isBreakEnd
  const accuracyLevel = gpsAccuracy ? getAccuracyLevel(gpsAccuracy) : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-md",
          isPositive ? "border-l-4 border-l-success" : isBreakStart ? "border-l-4 border-l-warning" : "border-l-4 border-l-destructive"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div
                className={cn(
                  "p-2 rounded-full",
                  isPositive ? "bg-success/10 text-success" : isBreakStart ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                )}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.05 + 0.1
                }}
              >
                {isClockIn ? (
                  <LogIn className="h-5 w-5" />
                ) : isBreakStart ? (
                  <Coffee className="h-5 w-5" />
                ) : isBreakEnd ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </motion.div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {isClockIn ? "Clock In" : isBreakStart ? "Break Start" : isBreakEnd ? "Break End" : "Clock Out"}
                  </span>
                  <span className="text-lg font-mono">
                    {formatTimeWithZone(timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{locationName}</span>
                </div>

                {notes && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {formatRelative(timestamp)}
              </span>

              {gpsAccuracy && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                >
                  <Badge
                    variant={
                      accuracyLevel === "high"
                        ? "success"
                        : accuracyLevel === "medium"
                          ? "warning"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {accuracyLevel === "low" && <AlertCircle className="h-3 w-3 mr-1" />}
                    ±{Math.round(gpsAccuracy)}m
                  </Badge>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
