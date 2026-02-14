"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgLink as Link } from "@/components/org-link"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?unreadOnly=true&limit=1")
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative rounded-xl">
        <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-primary")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
