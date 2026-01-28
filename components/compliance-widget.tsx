"use client"

import { motion } from "framer-motion"
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(
        "border-l-4 overflow-hidden",
        isCompliant ? "border-l-success" : daysWorked >= requiredDays - 1 ? "border-l-warning" : "border-l-muted"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Week Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {/* Animated progress bar */}
            <div className="h-3 flex-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  isCompliant ? "bg-success" : daysWorked >= requiredDays - 1 ? "bg-warning" : "bg-primary"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <motion.span
              className="text-lg font-semibold whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {daysWorked} of {requiredDays} days
            </motion.span>
          </div>

          <div className="flex justify-between">
            {weekDays.slice(0, 5).map((day, index) => (
              <motion.div
                key={day.day}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index + 0.3 }}
              >
                <span className="text-xs text-muted-foreground">{day.day}</span>
                {day.worked ? (
                  <motion.div
                    className="h-6 w-6 rounded-full bg-success flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                      delay: 0.1 * index + 0.4
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * index + 0.5 }}
                    >
                      <Check className="h-4 w-4 text-success-foreground" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground/30" />
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
