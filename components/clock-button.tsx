"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClockButtonProps {
  isClockedIn: boolean
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
  disabled?: boolean
}

export function ClockButton({ isClockedIn, onClockIn, onClockOut, disabled }: ClockButtonProps) {
  const [loading, setLoading] = useState(false)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [showSwipeHint, setShowSwipeHint] = useState(false)
  const startXRef = useRef<number | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleAction = async () => {
    if (loading || disabled) return

    // For clock-out, require swipe confirmation
    if (isClockedIn) {
      setShowSwipeHint(true)
      return
    }

    setLoading(true)
    try {
      await onClockIn()
    } finally {
      setLoading(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isClockedIn || loading || disabled) return
    startXRef.current = e.touches[0].clientX
    setShowSwipeHint(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isClockedIn || !startXRef.current || loading || disabled) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startXRef.current
    const buttonWidth = buttonRef.current?.offsetWidth || 200
    const progress = Math.min(Math.max(diff / (buttonWidth * 0.6), 0), 1)
    setSwipeProgress(progress)
  }

  const handleTouchEnd = async () => {
    if (!isClockedIn || loading || disabled) return

    if (swipeProgress >= 0.9) {
      setLoading(true)
      try {
        await onClockOut()
      } finally {
        setLoading(false)
      }
    }

    startXRef.current = null
    setSwipeProgress(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isClockedIn || loading || disabled) return
    startXRef.current = e.clientX
    setShowSwipeHint(false)

    const handleMouseMove = (e: MouseEvent) => {
      if (!startXRef.current) return
      const diff = e.clientX - startXRef.current
      const buttonWidth = buttonRef.current?.offsetWidth || 200
      const progress = Math.min(Math.max(diff / (buttonWidth * 0.6), 0), 1)
      setSwipeProgress(progress)
    }

    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)

      if (swipeProgress >= 0.9) {
        setLoading(true)
        try {
          await onClockOut()
        } finally {
          setLoading(false)
        }
      }

      startXRef.current = null
      setSwipeProgress(0)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <Button
      ref={buttonRef}
      variant={isClockedIn ? "destructive" : "success"}
      size="xl"
      className={cn(
        "relative w-full min-h-[72px] text-xl font-semibold overflow-hidden transition-all",
        isClockedIn && "cursor-grab active:cursor-grabbing",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={handleAction}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      disabled={disabled}
    >
      {/* Swipe progress indicator */}
      {isClockedIn && swipeProgress > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-white/20 transition-all"
          style={{ width: `${swipeProgress * 100}%` }}
        />
      )}

      <span className="relative z-10 flex flex-col items-center gap-1">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <span>{isClockedIn ? "CLOCK OUT" : "CLOCK IN"}</span>
            {isClockedIn && (showSwipeHint || swipeProgress > 0) && (
              <span className="text-xs font-normal opacity-75">
                {swipeProgress > 0
                  ? swipeProgress >= 0.9
                    ? "Release to confirm"
                    : "Keep sliding..."
                  : "Swipe right to confirm"}
              </span>
            )}
          </>
        )}
      </span>
    </Button>
  )
}
