"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DayStatus {
  day: string // Mon, Tue, etc.
  date: Date
  worked: boolean
}

interface ComplianceWidgetProps {
  daysWorked: number
  requiredDays: number
  weekDays: DayStatus[]
}

export function ComplianceWidget({ daysWorked, requiredDays, weekDays }: ComplianceWidgetProps) {
  const progress = Math.min((daysWorked / requiredDays) * 100, 100)
  const isCompliant = daysWorked >= requiredDays

  return (
    <Card className={cn(
      "border-l-4",
      isCompliant ? "border-l-success" : daysWorked >= requiredDays - 1 ? "border-l-warning" : "border-l-muted"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Week Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Progress
            value={progress}
            className="h-3 flex-1"
            indicatorClassName={cn(
              isCompliant ? "bg-success" : daysWorked >= requiredDays - 1 ? "bg-warning" : "bg-primary"
            )}
          />
          <span className="text-lg font-semibold whitespace-nowrap">
            {daysWorked} of {requiredDays} days
          </span>
        </div>

        <div className="flex justify-between">
          {weekDays.slice(0, 5).map((day) => (
            <div key={day.day} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{day.day}</span>
              {day.worked ? (
                <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-4 w-4 text-success-foreground" />
                </div>
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
