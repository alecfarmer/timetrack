"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseTimerReturn {
  seconds: number
  isRunning: boolean
  start: (startTime?: Date) => void
  stop: () => void
  reset: () => void
}

export function useTimer(initialStartTime?: Date): UseTimerReturn {
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

  return {
    seconds,
    isRunning,
    start,
    stop,
    reset,
  }
}
