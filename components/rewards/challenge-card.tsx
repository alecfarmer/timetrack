"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Coins, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface ChallengeCardProps {
  name: string
  description: string
  icon: string
  type: string
  progress: number
  target: number
  xpReward: number
  coinReward: number
  expiresAt: string
  status: string
  onClaim?: () => void
  claiming?: boolean
}

export function ChallengeCard({
  name,
  description,
  icon,
  type,
  progress,
  target,
  xpReward,
  coinReward,
  expiresAt,
  status,
  onClaim,
  claiming,
}: ChallengeCardProps) {
  const progressPercent = target > 0 ? (progress / target) * 100 : 0
  const isNearComplete = progressPercent >= 80
  const isComplete = status === "completed"

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-4 rounded-xl border transition-all",
        isComplete
          ? "bg-green-500/5 border-green-500/30"
          : "bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">{name}</p>
            <Badge variant="outline" className="text-[9px] px-1.5">
              {type}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">{description}</p>

          {/* Progress bar with goal gradient glow */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <Progress
                value={progressPercent}
                className={cn("h-2.5", isNearComplete && !isComplete && "animate-pulse")}
              />
              {isNearComplete && !isComplete && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-green-500/20 to-green-500/40 pointer-events-none" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
              {progress}/{target}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {!isComplete && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(expiresAt), { addSuffix: false })} left
              </span>
            )}
            {isNearComplete && !isComplete && (
              <span className="text-[10px] text-green-500 font-medium">Almost there!</span>
            )}
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500">
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                +{xpReward}
              </Badge>
              {coinReward > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">
                  <Coins className="h-2.5 w-2.5 mr-0.5" />
                  +{coinReward}
                </Badge>
              )}
            </div>
          </div>

          {/* Claim button */}
          {isComplete && onClaim && (
            <Button
              size="sm"
              onClick={onClaim}
              disabled={claiming}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
            >
              {claiming ? "Claiming..." : "Claim Reward"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
