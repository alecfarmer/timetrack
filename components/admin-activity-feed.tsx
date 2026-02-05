"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Activity, LogIn, LogOut, Coffee, Play, RefreshCw, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ActivityEvent {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"
  locationName: string
  timestamp: string
}

interface AdminActivityFeedProps {
  className?: string
  limit?: number
}

const EVENT_CONFIG = {
  CLOCK_IN: {
    icon: LogIn,
    label: "clocked in",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  CLOCK_OUT: {
    icon: LogOut,
    label: "clocked out",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  BREAK_START: {
    icon: Coffee,
    label: "started break",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  BREAK_END: {
    icon: Play,
    label: "ended break",
    color: "text-success",
    bgColor: "bg-success/10",
  },
}

export function AdminActivityFeed({ className, limit = 15 }: AdminActivityFeedProps) {
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/admin/activity?limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data.activity || [])
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivity()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30 * 1000)
    return () => clearInterval(interval)
  }, [limit])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchActivity()
  }

  const getInitials = (name: string, email: string) => {
    if (name && name !== "Team Member") {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "?"
  }

  if (loading) {
    return (
      <Card className={cn("border-0 shadow-lg", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activity.length} events
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
              <Activity className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Events will appear here as team members clock in</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {activity.map((event) => {
              const config = EVENT_CONFIG[event.type]
              const Icon = config.icon

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn("text-xs", config.bgColor, config.color)}>
                      {getInitials(event.userName, event.userEmail)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {event.userName !== "Team Member" ? event.userName : event.userEmail.split("@")[0]}
                      </span>
                      <span className={cn("text-xs", config.color)}>{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.locationName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
