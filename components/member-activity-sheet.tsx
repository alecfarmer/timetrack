"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LogIn,
  LogOut,
  Coffee,
  Play,
  Clock,
  MapPin,
  ArrowRight,
  Activity,
} from "lucide-react"
import { formatDistanceToNow, isToday as dateFnsIsToday, isYesterday, format } from "date-fns"
import { formatTime, formatDateInZone } from "@/lib/dates"
import { cn, tzHeaders } from "@/lib/utils"
import { useOrgRouter } from "@/components/org-link"

interface MemberActivitySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    userId: string
    displayName?: string | null
    email?: string | null
    isClockedIn?: boolean
    todayMinutes?: number
    todayLocation?: string | null
  } | null
}

interface Entry {
  id: string
  type: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END"
  timestampServer: string
  location: { id: string; name: string; code: string; category?: string } | null
}

const EVENT_CONFIG = {
  CLOCK_IN: {
    icon: LogIn,
    label: "Clock In",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    dotColor: "bg-emerald-500",
  },
  CLOCK_OUT: {
    icon: LogOut,
    label: "Clock Out",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    dotColor: "bg-red-500",
  },
  BREAK_START: {
    icon: Coffee,
    label: "Break Start",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    dotColor: "bg-amber-500",
  },
  BREAK_END: {
    icon: Play,
    label: "Break End",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    dotColor: "bg-emerald-500",
  },
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) return email[0].toUpperCase()
  return "?"
}

function groupEntriesByDate(entries: Entry[]): { label: string; date: string; entries: Entry[] }[] {
  const groups: Map<string, Entry[]> = new Map()

  for (const entry of entries) {
    const dateKey = formatDateInZone(entry.timestampServer, "yyyy-MM-dd")
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(entry)
  }

  return Array.from(groups.entries()).map(([dateKey, entries]) => {
    const sampleDate = new Date(entries[0].timestampServer)
    let label: string
    if (dateFnsIsToday(sampleDate)) {
      label = "Today"
    } else if (isYesterday(sampleDate)) {
      label = "Yesterday"
    } else {
      label = format(sampleDate, "EEEE, MMM d")
    }
    return { label, date: dateKey, entries }
  })
}

export function MemberActivitySheet({ open, onOpenChange, member }: MemberActivitySheetProps) {
  const router = useOrgRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!member) return

    const fetchEntries = async () => {
      setLoading(true)
      try {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 7)

        const params = new URLSearchParams({
          userId: member.userId,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        })

        const res = await fetch(`/api/admin/entries?${params}`, {
          headers: tzHeaders(),
        })

        if (res.ok) {
          const data = await res.json()
          setEntries(data.entries || [])
        }
      } catch (err) {
        console.error("Failed to fetch member entries:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [member?.userId])

  // Reset entries when sheet closes
  useEffect(() => {
    if (!open) {
      setEntries([])
    }
  }, [open])

  const grouped = groupEntriesByDate(entries)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Member Activity</SheetTitle>
          <SheetDescription>
            {member?.displayName || member?.email || "Team member"}
            {member?.displayName && member?.email && (
              <> &middot; {member.email}</>
            )}
          </SheetDescription>
        </SheetHeader>

        {member && (
          <div className="mt-6 space-y-6">
            {/* Member Header */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback
                  className={cn(
                    "text-sm font-semibold",
                    member.isClockedIn
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {getInitials(member.displayName, member.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {member.displayName || member.email || "Unknown"}
                </p>
                <Badge
                  variant={member.isClockedIn ? "default" : "secondary"}
                  className={cn(
                    "text-xs mt-1",
                    member.isClockedIn && "bg-emerald-500 hover:bg-emerald-600"
                  )}
                >
                  {member.isClockedIn ? (
                    <><Activity className="h-3 w-3 mr-1" />Clocked In</>
                  ) : (
                    "Offline"
                  )}
                </Badge>
              </div>
            </div>

            {/* Today Summary */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">Today Summary</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    member.isClockedIn ? "bg-emerald-500" : "bg-muted-foreground/40"
                  )} />
                  <span className="text-sm">
                    {member.isClockedIn ? "Clocked In" : "Offline"}
                  </span>
                </div>
                {(member.todayMinutes !== undefined && member.todayMinutes > 0) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatMinutes(member.todayMinutes)}
                  </div>
                )}
                {member.todayLocation && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {member.todayLocation}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-sm font-medium mb-3">Recent Entries</p>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No entries in the last 7 days</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map((group) => (
                    <div key={group.date}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground px-2">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <div className="space-y-1">
                        {group.entries.map((entry) => {
                          const config = EVENT_CONFIG[entry.type]
                          const Icon = config.icon

                          return (
                            <div
                              key={entry.id}
                              className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                                <Icon className={cn("h-3.5 w-3.5", config.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">{config.label}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(entry.timestampServer)}
                              </span>
                              {entry.location && (
                                <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                                  {entry.location.code || entry.location.name}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                                {formatDistanceToNow(new Date(entry.timestampServer), { addSuffix: true })}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false)
                router.push(`/admin/entries/${member.userId}`)
              }}
            >
              View All Entries
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
