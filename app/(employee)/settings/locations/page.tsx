"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Navigation, Check, RefreshCw } from "lucide-react"
import Link from "next/link"
import { formatDistance, calculateDistance } from "@/lib/geo"
import { useGeolocation } from "@/hooks/use-geolocation"

interface Location {
  id: string
  name: string
  code: string | null
  category: string
  address: string
  latitude: number
  longitude: number
  geofenceRadius: number
  isDefault: boolean
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { position } = useGeolocation(true)

  const updateLocationCoords = async (locationId: string) => {
    if (!position) return
    setUpdating(locationId)
    try {
      const res = await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: locationId,
          latitude: position.latitude,
          longitude: position.longitude,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLocations(locs => locs.map(l => l.id === locationId ? updated : l))
      }
    } catch (err) {
      console.error("Failed to update location:", err)
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations")
        if (res.ok) {
          const data = await res.json()
          setLocations(data)
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [])

  const getDistanceToLocation = (loc: Location) => {
    if (!position) return null
    return calculateDistance(
      position.latitude,
      position.longitude,
      loc.latitude,
      loc.longitude
    )
  }

  const isWithinGeofence = (loc: Location) => {
    const distance = getDistanceToLocation(loc)
    return distance !== null && distance <= loc.geofenceRadius
  }

  // Convert meters to feet for display
  const formatGeofenceRadius = (meters: number) => {
    const feet = Math.round(meters * 3.28084)
    return `${feet} ft`
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Locations</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading locations...
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No locations configured
          </div>
        ) : (
          locations.map((location, index) => {
            const distance = getDistanceToLocation(location)
            const withinGeofence = isWithinGeofence(location)

            return (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={withinGeofence ? "border-green-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-5 w-5 ${withinGeofence ? "text-green-500" : "text-muted-foreground"}`} />
                        <div>
                          <CardTitle className="text-base">{location.name}</CardTitle>
                          {location.code && (
                            <Badge variant="secondary" className="mt-1">
                              {location.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {location.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {location.address}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Geofence radius</span>
                      <span>{formatGeofenceRadius(location.geofenceRadius)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Coordinates</span>
                      <span className="font-mono text-xs">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </span>
                    </div>

                    {distance !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Distance</span>
                        <span className={withinGeofence ? "text-green-600 font-medium" : ""}>
                          {formatDistance(distance)}
                          {withinGeofence && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              On-site
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {!position && (
                      <p className="text-xs text-amber-600">
                        Enable location services to see distance
                      </p>
                    )}

                    {position && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => updateLocationCoords(location.id)}
                        disabled={updating === location.id}
                      >
                        {updating === location.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4 mr-2" />
                        )}
                        Set to Current Location
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}

        <div className="pt-4 text-center text-xs text-muted-foreground">
          <p>Locations are configured by your administrator.</p>
          <p>Contact support to request changes.</p>
        </div>
      </main>
    </div>
  )
}
