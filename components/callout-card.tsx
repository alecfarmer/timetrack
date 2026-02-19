"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  PhoneOff,
} from "lucide-react"
import { format } from "date-fns"

interface Location {
  id: string
  name: string
  code: string | null
}

export interface Callout {
  id: string
  incidentNumber: string
  locationId: string
  location: Location
  priority?: "P1" | "P2" | "P3" | "P4" | "P5"
  timeReceived: string
  timeStarted: string | null
  timeEnded: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAccuracy: number | null
  description: string | null
  resolution: string | null
  createdAt: string
}

const priorityColors: Record<string, string> = {
  P1: "bg-red-600 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-yellow-500 text-black",
  P4: "bg-blue-500 text-white",
  P5: "bg-slate-500 text-white",
}

interface CalloutCardProps {
  callout: Callout
  expanded: boolean
  onToggleExpand: () => void
  onStartWork?: () => void
  onEndCallout?: (resolution?: string) => void
}

export function CalloutCard({
  callout,
  expanded,
  onToggleExpand,
  onStartWork,
  onEndCallout,
}: CalloutCardProps) {
  const [resolution, setResolution] = useState("")
  const isActive = !callout.timeEnded
  const isWorking = callout.timeStarted && !callout.timeEnded

  const calculateDuration = () => {
    const start = new Date(callout.timeReceived)
    const end = callout.timeEnded ? new Date(callout.timeEnded) : new Date()
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000)

    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={`border-0 shadow-lg transition-all ${
          isActive ? "ring-2 ring-warning/50 bg-warning/5" : "hover:shadow-xl"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between cursor-pointer" onClick={onToggleExpand}>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {callout.priority && (
                  <Badge className={`${priorityColors[callout.priority]} font-bold text-xs px-1.5`}>
                    {callout.priority}
                  </Badge>
                )}
                <span className="font-mono font-bold text-lg">{callout.incidentNumber}</span>
                {isActive && (
                  <Badge variant="warning" className="gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {isWorking ? "In Progress" : "Active"}
                  </Badge>
                )}
                {callout.priority === "P1" && !callout.timeEnded && (
                  <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                    Earns comp time
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {callout.location.code || callout.location.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(new Date(callout.timeReceived), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-semibold">{calculateDuration()}</p>
                <p className="text-xs text-muted-foreground">duration</p>
              </div>
              {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t space-y-4"
              >
                {callout.description && (
                  <div className="bg-muted/50 rounded-xl p-3">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm mt-1">{callout.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <Label className="text-xs text-muted-foreground">Received</Label>
                    <p className="font-medium">{format(new Date(callout.timeReceived), "h:mm:ss a")}</p>
                  </div>
                  {callout.timeStarted && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <Label className="text-xs text-muted-foreground">Started</Label>
                      <p className="font-medium">{format(new Date(callout.timeStarted), "h:mm:ss a")}</p>
                    </div>
                  )}
                  {callout.timeEnded && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <Label className="text-xs text-muted-foreground">Ended</Label>
                      <p className="font-medium">{format(new Date(callout.timeEnded), "h:mm:ss a")}</p>
                    </div>
                  )}
                </div>

                {callout.resolution && (
                  <div className="bg-success/10 rounded-xl p-3">
                    <Label className="text-xs text-success">Resolution</Label>
                    <p className="text-sm mt-1">{callout.resolution}</p>
                  </div>
                )}

                {isActive && (
                  <div className="space-y-3 pt-2">
                    {!callout.timeStarted && onStartWork && (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={(e) => { e.stopPropagation(); onStartWork() }}
                      >
                        Start Working
                      </Button>
                    )}
                    {onEndCallout && (
                      <>
                        <Textarea
                          placeholder="Resolution notes (optional)"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          rows={2}
                          className="rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="default"
                          className="w-full gap-2 rounded-xl"
                          onClick={(e) => { e.stopPropagation(); onEndCallout(resolution) }}
                        >
                          <PhoneOff className="h-4 w-4" />
                          End Callout
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
