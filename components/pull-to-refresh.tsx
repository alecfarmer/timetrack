"use client"

import { useState, useRef, useEffect, ReactNode, useCallback } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { RefreshCw, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
  threshold?: number // Pull distance to trigger refresh
  className?: string
}

const PULL_THRESHOLD = 80
const MAX_PULL = 120

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = PULL_THRESHOLD,
  className,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pullDistance = useMotionValue(0)

  const indicatorY = useTransform(pullDistance, [0, MAX_PULL], [0, MAX_PULL])
  const indicatorOpacity = useTransform(pullDistance, [0, threshold / 2, threshold], [0, 0.5, 1])
  const indicatorScale = useTransform(pullDistance, [0, threshold], [0.5, 1])
  const indicatorRotation = useTransform(pullDistance, [0, threshold, MAX_PULL], [0, 180, 360])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || refreshing) return

    // Record start position — don't activate pulling yet
    startY.current = e.touches[0].clientY
  }, [disabled, refreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || refreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // Only activate pull-to-refresh when page AND container are scrolled to top AND moving down
    if (!pulling) {
      const pageScrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const containerScrollTop = containerRef.current?.scrollTop || 0
      if (pageScrollTop > 0 || containerScrollTop > 0 || diff <= 0) return
      // Need at least a small threshold before activating to avoid false triggers
      if (diff < 10) return
      setPulling(true)
    }

    if (diff > 0) {
      // Prevent default scroll when pulling down
      e.preventDefault()

      // Apply resistance as pull increases
      const resistance = 1 - Math.min(diff / (MAX_PULL * 2), 0.5)
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL)
      pullDistance.set(adjustedDiff)
    }
  }, [pulling, disabled, refreshing, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return
    setPulling(false)

    const currentPull = pullDistance.get()

    if (currentPull >= threshold && !refreshing) {
      setRefreshing(true)
      animate(pullDistance, threshold - 20, { type: "spring", stiffness: 400, damping: 30 })

      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        animate(pullDistance, 0, { type: "spring", stiffness: 300, damping: 25 })
      }
    } else {
      animate(pullDistance, 0, { type: "spring", stiffness: 400, damping: 30 })
    }
  }, [pulling, pullDistance, threshold, refreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Pull indicator */}
      <motion.div
        style={{ y: indicatorY, opacity: indicatorOpacity, scale: indicatorScale }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            refreshing
              ? "bg-primary text-primary-foreground"
              : pullDistance.get() >= threshold
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
          )}
          style={{ rotate: refreshing ? undefined : indicatorRotation }}
        >
          {refreshing ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown className="h-5 w-5" />
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: indicatorY }}>
        {children}
      </motion.div>
    </div>
  )
}

// Simpler refresh button for desktop
export function RefreshButton({
  onRefresh,
  refreshing = false,
  className,
}: {
  onRefresh: () => Promise<void> | void
  refreshing?: boolean
  className?: string
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const actualRefreshing = refreshing || isRefreshing

  const handleClick = async () => {
    if (actualRefreshing) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={actualRefreshing}
      className={cn(
        "p-2 rounded-xl transition-colors hover:bg-muted disabled:opacity-50",
        className
      )}
      title="Refresh"
    >
      <RefreshCw className={cn("h-5 w-5", actualRefreshing && "animate-spin")} />
    </button>
  )
}
