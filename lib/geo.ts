export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface LocationDistance {
  locationId: string
  name: string
  distance: number // meters
  isWithinGeofence: boolean
}

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  const km = meters / 1000
  return `${km.toFixed(1)}km`
}

export function getAccuracyLevel(accuracy: number): "high" | "medium" | "low" {
  if (accuracy <= 20) return "high"
  if (accuracy <= 50) return "medium"
  return "low"
}

export function getAccuracyColor(accuracy: number): string {
  const level = getAccuracyLevel(accuracy)
  switch (level) {
    case "high":
      return "text-green-500"
    case "medium":
      return "text-yellow-500"
    case "low":
      return "text-red-500"
  }
}

export function isWithinGeofence(
  userLat: number,
  userLon: number,
  locationLat: number,
  locationLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, locationLat, locationLon)
  return distance <= radiusMeters
}

export async function getCurrentPosition(options?: PositionOptions): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => {
        let message = "Failed to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied"
            break
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable"
            break
          case error.TIMEOUT:
            message = "Location request timed out"
            break
        }
        reject(new Error(message))
      },
      { ...defaultOptions, ...options }
    )
  })
}
