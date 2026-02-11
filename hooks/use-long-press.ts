"use client"

import { useRef, useCallback, useState, useEffect } from "react"

interface UseLongPressOptions {
  duration?: number
  onLongPress: () => void
  onTap?: () => void
  onProgress?: (progress: number) => void
  disabled?: boolean
}

interface UseLongPressReturn {
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
    onPointerLeave: (e: React.PointerEvent) => void
    onPointerCancel: (e: React.PointerEvent) => void
  }
  isPressed: boolean
  progress: number
}

export function useLongPress({
  duration = 3000,
  onLongPress,
  onTap,
  onProgress,
  disabled = false,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const completedRef = useRef(false)

  // Store callbacks in refs to avoid stale closures in rAF loop
  const onProgressRef = useRef(onProgress)
  const onLongPressRef = useRef(onLongPress)
  const onTapRef = useRef(onTap)
  const durationRef = useRef(duration)

  useEffect(() => {
    onProgressRef.current = onProgress
    onLongPressRef.current = onLongPress
    onTapRef.current = onTap
    durationRef.current = duration
  })

  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    stopAnimation()
    setIsPressed(false)
    setProgress(0)
    onProgressRef.current?.(0)
  }, [stopAnimation])

  const startAnimation = useCallback(() => {
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min(1, elapsed / durationRef.current)
      setProgress(p)
      onProgressRef.current?.(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return
      e.preventDefault()

      completedRef.current = false
      startTimeRef.current = Date.now()
      setIsPressed(true)
      setProgress(0)

      startAnimation()

      timerRef.current = window.setTimeout(() => {
        completedRef.current = true
        setProgress(1)
        onProgressRef.current?.(1)
        setIsPressed(false)
        stopAnimation()

        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }

        onLongPressRef.current()

        setTimeout(() => {
          setProgress(0)
          onProgressRef.current?.(0)
        }, 500)
      }, durationRef.current)
    },
    [disabled, startAnimation, stopAnimation]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!completedRef.current) {
        e.preventDefault()
        if (startTimeRef.current > 0) {
          onTapRef.current?.()
        }
      }
      cancel()
      startTimeRef.current = 0
    },
    [cancel]
  )

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
    isPressed,
    progress,
  }
}
