"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"

// Lazy wrapper that only loads the full widget when visible
export function StreaksWidgetLazy() {
  const [isVisible, setIsVisible] = useState(false)
  const [StreaksWidget, setStreaksWidget] = useState<React.ComponentType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  // Dynamically import the widget only when visible
  useEffect(() => {
    if (isVisible && !StreaksWidget) {
      import("@/components/streaks-widget").then((mod) => {
        setStreaksWidget(() => mod.StreaksWidget)
      })
    }
  }, [isVisible, StreaksWidget])

  if (!isVisible || !StreaksWidget) {
    return (
      <div ref={containerRef}>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
              </div>
            </div>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mt-4">
              <div className="flex-1 py-2 flex items-center justify-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <StreaksWidget />
}
