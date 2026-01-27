"use client"

import { useState, useCallback, useEffect } from "react"
import { GeoPosition, getCurrentPosition } from "@/lib/geo"

interface UseGeolocationState {
  position: GeoPosition | null
  loading: boolean
  error: string | null
}

interface UseGeolocationReturn extends UseGeolocationState {
  refresh: () => Promise<void>
  watchPosition: () => void
  stopWatching: () => void
}

export function useGeolocation(autoStart = false): UseGeolocationReturn {
  const [state, setState] = useState<UseGeolocationState>({
    position: null,
    loading: false,
    error: null,
  })
  const [watchId, setWatchId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const position = await getCurrentPosition()
      setState({ position, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to get location",
      }))
    }
  }, [])

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
      }))
      return
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          },
          loading: false,
          error: null,
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
        setState((prev) => ({ ...prev, loading: false, error: message }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )
    setWatchId(id)
  }, [])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  useEffect(() => {
    if (autoStart) {
      refresh()
    }
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [autoStart, refresh, watchId])

  return {
    ...state,
    refresh,
    watchPosition,
    stopWatching,
  }
}
