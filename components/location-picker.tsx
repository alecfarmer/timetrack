"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation } from "lucide-react"
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
          isWithinGeofence: distance <= loc.geofenceRadius,
        }
      })
      // Sort by distance
      withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      setLocationsWithDistance(withDistance)
    } else {
      setLocationsWithDistance(locations)
    }
  }, [locations, userPosition])

  const selectedLocation = locationsWithDistance.find((l) => l.id === selectedId)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Location</span>
      </div>

      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedLocation && (
              <div className="flex items-center gap-2">
                <span>{selectedLocation.name}</span>
                {selectedLocation.code && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedLocation.code}
                  </Badge>
                )}
                {selectedLocation.distance !== undefined && (
                  <span className="text-muted-foreground">
                    · {formatDistance(selectedLocation.distance)}
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locationsWithDistance.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                  <span>{location.name}</span>
                  {location.code && (
                    <Badge variant="secondary" className="text-xs">
                      {location.code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {location.isWithinGeofence && (
                    <Navigation className="h-3 w-3 text-success" />
                  )}
                  {location.distance !== undefined && (
                    <span className="text-xs">
                      {formatDistance(location.distance)}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
