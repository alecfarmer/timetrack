"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTime, formatRelative } from "@/lib/dates"
import { getAccuracyLevel, formatDistance as formatGeoDistance } from "@/lib/geo"
import { LogIn, LogOut, MapPin, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EntryCardProps {
  type: "CLOCK_IN" | "CLOCK_OUT"
  timestamp: Date | string
  locationName: string
  gpsAccuracy?: number | null
  notes?: string | null
  onClick?: () => void
}

export function EntryCard({
  type,
  timestamp,
  locationName,
  gpsAccuracy,
  notes,
  onClick,
}: EntryCardProps) {
  const isClockIn = type === "CLOCK_IN"
  const accuracyLevel = gpsAccuracy ? getAccuracyLevel(gpsAccuracy) : null

  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-accent/50 transition-colors",
        isClockIn ? "border-l-4 border-l-success" : "border-l-4 border-l-destructive"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isClockIn ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {isClockIn ? (
                <LogIn className="h-5 w-5" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {isClockIn ? "Clock In" : "Clock Out"}
                </span>
                <span className="text-lg font-mono">
                  {formatTime(timestamp)}
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
