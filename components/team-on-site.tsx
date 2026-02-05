"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface TeamMember {
  userId: string
  name: string
  email: string
  locationName: string
  clockedInAt: string
  avatarUrl?: string
}

interface TeamOnSiteProps {
  className?: string
}

export function TeamOnSite({ className }: TeamOnSiteProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOnSite() {
      try {
        const res = await fetch("/api/team/on-site")
        if (res.ok) {
          const data = await res.json()
          setMembers(data.onSite || [])
          setCount(data.totalTeamOnSite || 0)
        }
      } catch (error) {
        console.error("Failed to fetch on-site data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOnSite()

    // Refresh every 2 minutes
    const interval = setInterval(fetchOnSite, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team On-Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team On-Site
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {count} {count === 1 ? "person" : "people"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {count === 0 ? "No one else is on-site right now" : "You're the only one here!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.slice(0, 5).map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.name !== "Team Member" ? member.name : member.email.split("@")[0]}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{member.locationName}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(member.clockedInAt), { addSuffix: false })}</span>
                </div>
              </div>
            ))}
            {members.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{members.length - 5} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
