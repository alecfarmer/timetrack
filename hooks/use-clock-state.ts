"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { queueOfflineEntry } from "@/lib/offline"
import { GeoPosition, formatDistance, calculateDistance } from "@/lib/geo"
import { getTimezone } from "@/lib/dates"

function tzHeaders(): Record<string, string> {
  return { "x-timezone": getTimezone() }
}

interface Location {
  id: string
  name: string
  code: string | null
  category: string
  latitude: number
  longitude: number
  geofenceRadius: number
  isDefault: boolean
}

interface Entry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"
  timestampServer: string
  timestampClient: string
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  notes: string | null
  location: {
    id: string
    name: string
    code: string | null
  }
}

interface CurrentStatus {
  isClockedIn: boolean
  activeClockIn: Entry | null
  currentSessionStart: string | null
  todayEntries: Entry[]
  totalMinutesToday: number
}

interface WeekDay {
  date: string
  dayOfWeek: string
  worked: boolean
}

interface WeekSummary {
  daysWorked: number
  requiredDays: number
  isCompliant: boolean
  weekDays: WeekDay[]
}

interface UseClockStateReturn {
  locations: Location[]
  selectedLocationId: string
  setSelectedLocationId: (id: string) => void
  selectedLocation: Location | undefined
  currentStatus: CurrentStatus | null
  weekSummary: WeekSummary | null
  loading: boolean
  refreshing: boolean
  error: string | null
  setError: (error: string | null) => void
  isOffline: boolean
  needsOnboarding: boolean
  eightHourAlert: boolean
  setEightHourAlert: (v: boolean) => void
  distanceToSelected: number | null
  isWithinGeofence: boolean
  pendingPhotoUrl: string | null
  setPendingPhotoUrl: (url: string | null) => void
  isOnBreak: boolean
  handleClockIn: () => Promise<void>
  handleClockOut: () => Promise<void>
  handleBreakStart: () => Promise<void>
  handleBreakEnd: () => Promise<void>
  handleRefresh: (refreshGps: () => Promise<void>) => Promise<void>
  handleOnboardingComplete: () => Promise<void>
  fetchCurrentStatus: () => Promise<void>
  fetchWeekSummary: () => Promise<void>
}

export function useClockState(position: GeoPosition | null): UseClockStateReturn {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(null)
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [eightHourAlert, setEightHourAlert] = useState(false)
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null)
  const eightHourAlertShown = useRef(false)
  const statusFetchedAt = useRef<number>(Date.now())

  // Detect offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    setIsOffline(!navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations")
      if (!res.ok) throw new Error("Failed to fetch locations")
      const data = await res.json()
      setLocations(data)
      const defaultLoc = data.find((l: Location) => l.isDefault) || data[0]
      if (defaultLoc) {
        setSelectedLocationId((prev) => prev || defaultLoc.id)
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
      setError("Failed to load locations")
    }
  }, [])

  const fetchCurrentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/entries/current", { headers: tzHeaders() })
      if (!res.ok) throw new Error("Failed to fetch status")
      const data = await res.json()
      setCurrentStatus(data)
      statusFetchedAt.current = Date.now()
    } catch (err) {
      console.error("Error fetching current status:", err)
    }
  }, [])

  const fetchWeekSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/workdays/week", { headers: tzHeaders() })
      if (!res.ok) throw new Error("Failed to fetch week summary")
      const data = await res.json()
      setWeekSummary(data)
    } catch (err) {
      console.error("Error fetching week summary:", err)
    }
  }, [])

  // Initial data fetch — check onboarding first
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const onboardRes = await fetch("/api/onboarding")
        if (onboardRes.ok) {
          const onboardData = await onboardRes.json()
          if (onboardData.needsOnboarding) {
            setNeedsOnboarding(true)
            setLoading(false)
            return
          }
        }
      } catch {
        // Continue loading if onboarding check fails
      }
      await Promise.all([fetchLocations(), fetchCurrentStatus(), fetchWeekSummary()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchLocations, fetchCurrentStatus, fetchWeekSummary])

  // Auto-select nearest location when GPS updates
  useEffect(() => {
    if (position && locations.length > 0) {
      const nearestLocation = locations.reduce((nearest, loc) => {
        const distance = calculateDistance(position.latitude, position.longitude, loc.latitude, loc.longitude)
        const nearestDistance = calculateDistance(position.latitude, position.longitude, nearest.latitude, nearest.longitude)
        return distance < nearestDistance ? loc : nearest
      })
      const distanceToNearest = calculateDistance(position.latitude, position.longitude, nearestLocation.latitude, nearestLocation.longitude)
      if (distanceToNearest <= nearestLocation.geofenceRadius) {
        setSelectedLocationId(nearestLocation.id)
      }
    }
  }, [position, locations])

  // 8-hour workday threshold alert
  useEffect(() => {
    if (!currentStatus?.isClockedIn) return

    const checkThreshold = () => {
      const totalAtFetch = currentStatus.totalMinutesToday || 0
      const minutesSinceFetch = (Date.now() - statusFetchedAt.current) / 60000
      const totalMinutes = totalAtFetch + minutesSinceFetch

      if (totalMinutes >= 480 && !eightHourAlertShown.current) {
        eightHourAlertShown.current = true
        setEightHourAlert(true)
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      }
    }

    checkThreshold()
    const interval = setInterval(checkThreshold, 30000)
    return () => clearInterval(interval)
  }, [currentStatus?.isClockedIn, currentStatus?.totalMinutesToday])

  // Reset alert flag on clock-out
  useEffect(() => {
    if (!currentStatus?.isClockedIn) {
      eightHourAlertShown.current = false
    }
  }, [currentStatus?.isClockedIn])

  // Dynamic browser tab title with live timer
  useEffect(() => {
    if (!currentStatus?.isClockedIn) {
      document.title = "OnSite"
      return
    }

    const updateTitle = () => {
      const totalAtFetch = currentStatus.totalMinutesToday || 0
      const minutesSinceFetch = (Date.now() - statusFetchedAt.current) / 60000
      const totalMinutes = Math.floor(totalAtFetch + minutesSinceFetch)
      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60
      const timeStr = `${h}h ${m.toString().padStart(2, "0")}m`

      if (eightHourAlert) {
        document.title = `[8h+] ${timeStr} - OnSite`
      } else {
        document.title = `${timeStr} - OnSite`
      }
    }

    updateTitle()
    const interval = setInterval(updateTitle, 15000)
    return () => {
      clearInterval(interval)
      document.title = "OnSite"
    }
  }, [currentStatus?.isClockedIn, currentStatus?.totalMinutesToday, eightHourAlert])

  // Derived state
  const selectedLocation = locations.find((l) => l.id === selectedLocationId)
  const distanceToSelected =
    position && selectedLocation
      ? calculateDistance(position.latitude, position.longitude, selectedLocation.latitude, selectedLocation.longitude)
      : null
  const isWithinGeofence =
    distanceToSelected !== null && selectedLocation != null && distanceToSelected <= Math.max(selectedLocation.geofenceRadius, 200)

  const handleClockIn = useCallback(async () => {
    if (!selectedLocationId) {
      setError("Please select a location")
      return
    }
    if (!position) {
      setError("Unable to get your location. Please enable GPS.")
      return
    }
    if (!isWithinGeofence) {
      const distance = distanceToSelected ? formatDistance(distanceToSelected) : "unknown"
      setError(`You must be on-site to clock in. You are ${distance} away from ${selectedLocation?.name || "the location"}.`)
      return
    }
    try {
      const entryBody: Record<string, unknown> = {
        type: "CLOCK_IN",
        locationId: selectedLocationId,
        timestampClient: new Date().toISOString(),
        gpsLatitude: position?.latitude,
        gpsLongitude: position?.longitude,
        gpsAccuracy: position?.accuracy,
      }
      if (pendingPhotoUrl) {
        entryBody.photoUrl = pendingPhotoUrl
      }
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify(entryBody),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to clock in")
      }
      setPendingPhotoUrl(null)
      await Promise.all([fetchCurrentStatus(), fetchWeekSummary()])
      if (navigator.vibrate) navigator.vibrate(100)
    } catch (err) {
      if (!navigator.onLine) {
        await queueOfflineEntry({
          type: "CLOCK_IN",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position?.latitude || null,
          gpsLongitude: position?.longitude || null,
          gpsAccuracy: position?.accuracy || null,
        })
        setError("You're offline. Entry has been queued and will sync when you're back online.")
        if (navigator.vibrate) navigator.vibrate(100)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to clock in")
    }
  }, [selectedLocationId, position, isWithinGeofence, distanceToSelected, selectedLocation, fetchCurrentStatus, fetchWeekSummary])

  const handleClockOut = useCallback(async () => {
    if (!position) {
      setError("Unable to get your location. Please enable GPS.")
      return
    }
    if (!isWithinGeofence) {
      const distance = distanceToSelected ? formatDistance(distanceToSelected) : "unknown"
      setError(`You must be on-site to clock out. You are ${distance} away from ${selectedLocation?.name || "the location"}.`)
      return
    }
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          type: "CLOCK_OUT",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position?.latitude,
          gpsLongitude: position?.longitude,
          gpsAccuracy: position?.accuracy,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to clock out")
      }
      await Promise.all([fetchCurrentStatus(), fetchWeekSummary()])
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    } catch (err) {
      if (!navigator.onLine) {
        await queueOfflineEntry({
          type: "CLOCK_OUT",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position?.latitude || null,
          gpsLongitude: position?.longitude || null,
          gpsAccuracy: position?.accuracy || null,
        })
        setError("You're offline. Entry has been queued and will sync when you're back online.")
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
        return
      }
      setError(err instanceof Error ? err.message : "Failed to clock out")
    }
  }, [selectedLocationId, position, isWithinGeofence, distanceToSelected, selectedLocation, fetchCurrentStatus, fetchWeekSummary])

  const handleBreakStart = useCallback(async () => {
    if (!selectedLocationId || !position) return
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          type: "BREAK_START",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position.latitude,
          gpsLongitude: position.longitude,
          gpsAccuracy: position.accuracy,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to start break")
      }
      await fetchCurrentStatus()
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start break")
    }
  }, [selectedLocationId, position, fetchCurrentStatus])

  const handleBreakEnd = useCallback(async () => {
    if (!selectedLocationId || !position) return
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          type: "BREAK_END",
          locationId: selectedLocationId,
          timestampClient: new Date().toISOString(),
          gpsLatitude: position.latitude,
          gpsLongitude: position.longitude,
          gpsAccuracy: position.accuracy,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to end break")
      }
      await fetchCurrentStatus()
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end break")
    }
  }, [selectedLocationId, position, fetchCurrentStatus])

  // Derive break status from today's entries
  const isOnBreak = (() => {
    if (!currentStatus?.todayEntries) return false
    const entries = currentStatus.todayEntries
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].type === "BREAK_START") return true
      if (entries[i].type === "BREAK_END" || entries[i].type === "CLOCK_OUT") return false
    }
    return false
  })()

  const handleRefresh = useCallback(async (refreshGps: () => Promise<void>) => {
    setRefreshing(true)
    await Promise.all([fetchCurrentStatus(), fetchWeekSummary(), refreshGps()])
    setRefreshing(false)
  }, [fetchCurrentStatus, fetchWeekSummary])

  const handleOnboardingComplete = useCallback(async () => {
    setNeedsOnboarding(false)
    setLoading(true)
    await Promise.all([fetchLocations(), fetchCurrentStatus(), fetchWeekSummary()])
    setLoading(false)
  }, [fetchLocations, fetchCurrentStatus, fetchWeekSummary])

  return {
    locations,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocation,
    currentStatus,
    weekSummary,
    loading,
    refreshing,
    error,
    setError,
    isOffline,
    needsOnboarding,
    eightHourAlert,
    setEightHourAlert,
    distanceToSelected,
    isWithinGeofence,
    pendingPhotoUrl,
    setPendingPhotoUrl,
    isOnBreak,
    handleClockIn,
    handleClockOut,
    handleBreakStart,
    handleBreakEnd,
    handleRefresh,
    handleOnboardingComplete,
    fetchCurrentStatus,
    fetchWeekSummary,
  }
}
