"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseTimerReturn {
  seconds: number
  elapsed: number
  formatted: string
  isRunning: boolean
  start: (startTime?: Date) => void
  stop: () => void
  reset: () => void
}

export function useTimer(initialStartTime?: Date | null): UseTimerReturn {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const calculateSeconds = useCallback(() => {
    if (startTimeRef.current) {
      const now = new Date()
      const diff = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000)
      return Math.max(0, diff)
    }
    return 0
  }, [])

  const start = useCallback((startTime?: Date) => {
    startTimeRef.current = startTime || new Date()
    setSeconds(calculateSeconds())
    setIsRunning(true)
  }, [calculateSeconds])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setSeconds(0)
    startTimeRef.current = null
  }, [stop])

  useEffect(() => {
    if (initialStartTime) {
      start(initialStartTime)
    }
  }, [initialStartTime, start])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(calculateSeconds())
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, calculateSeconds])

  // Format seconds as HH:MM:SS
  const formatTimer = (secs: number): string => {
    const hours = Math.floor(secs / 3600)
    const minutes = Math.floor((secs % 3600) / 60)
    const remainingSecs = secs % 60
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSecs)}`
  }

  return {
    seconds,
    elapsed: seconds,
    formatted: formatTimer(seconds),
    isRunning,
    start,
    stop,
    reset,
  }
}
