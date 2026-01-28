"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { MapPin, Check } from "lucide-react"
import { calculateDistance, formatDistance } from "@/lib/geo"
import { cn } from "@/lib/utils"

interface Location {
  id: string
  name: string
  code?: string | null
  latitude: number
  longitude: number
  geofenceRadius: number
}

interface LocationPickerProps {
  locations: Location[]
  selectedId: string
  userPosition?: { latitude: number; longitude: number } | null
  onSelect: (locationId: string) => void
  className?: string
}

export function LocationPicker({
  locations,
  selectedId,
  userPosition,
  onSelect,
  className,
}: LocationPickerProps) {
  const [locationsWithDistance, setLocationsWithDistance] = useState<
    (Location & { distance?: number; isWithinGeofence?: boolean })[]
  >([])

  useEffect(() => {
    if (userPosition) {
      const withDistance = locations.map((loc) => {
        const distance = calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          loc.latitude,
          loc.longitude
        )
        return {
          ...loc,
          distance,
          // Allow within geofence OR within 200m for GPS flexibility
          isWithinGeofence: distance <= Math.max(loc.geofenceRadius, 200),
        }
      })
      // Sort by distance
      withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      setLocationsWithDistance(withDistance)
    } else {
      setLocationsWithDistance(locations)
    }
  }, [locations, userPosition])

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <MapPin className="h-4 w-4" />
        <span>Select Location</span>
      </div>

      <div className="grid gap-2">
        {locationsWithDistance.map((location) => {
          const isSelected = location.id === selectedId
          const isOnSite = location.isWithinGeofence

          return (
            <motion.button
              key={location.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(location.id)}
              className={cn(
                "w-full p-3 rounded-lg border text-left transition-all",
                "flex items-center justify-between gap-3",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                isOnSite && !isSelected && "border-green-500/50 bg-green-50 dark:bg-green-950/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isOnSite
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {location.code || location.name.substring(0, 2)}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {location.name}
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {location.distance !== undefined ? (
                      <span className={isOnSite ? "text-green-600 font-medium" : ""}>
                        {formatDistance(location.distance)}
                        {isOnSite && " · On-site"}
                      </span>
                    ) : (
                      "Calculating distance..."
                    )}
                  </div>
                </div>
              </div>

              {isOnSite && !isSelected && (
                <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                  Nearby
                </Badge>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
