"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLiveXP, useRealtime } from "@/contexts/realtime-context"
import {
  Award,
  Flame,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgLink as Link } from "@/components/org-link"

interface BadgeInfo {
  id: string
  name: string
  icon: string
}

// Circular progress ring component
function LevelRing({
  level,
  progress,
  size = 56,
  strokeWidth = 4,
}: {
  level: number
  progress: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      {/* Level number in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none">{level}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wide">lvl</span>
      </div>
    </div>
  )
}

function BadgeDetailModal({
  badge,
  isOpen,
  onClose,
}: {
  badge: BadgeInfo | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!badge) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[280px]">
        <DialogHeader>
          <DialogTitle className="text-center text-base">Badge Earned</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-3">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-3"
          >
            <span className="text-3xl">{badge.icon}</span>
          </motion.div>
          <h3 className="font-semibold text-center mb-1">{badge.name}</h3>
          <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            Recently Earned
          </Badge>
          <Link
            href="/rewards"
            className="mt-3 text-xs text-primary hover:underline flex items-center gap-0.5"
            onClick={onClose}
          >
            View all badges
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact mobile card
function MobileXPCard() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null)

  const xpInLevel = Math.round((xpProgress / 100) * xpToNext)
  const xpNeeded = xpToNext - xpInLevel

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card border p-3"
      >
        <div className="flex items-center gap-3">
          {/* Level ring */}
          <LevelRing level={level} progress={xpProgress} size={52} strokeWidth={4} />

          {/* XP info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{totalXP.toLocaleString()} XP</span>
              {sessionXP > 0 && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-medium text-green-500"
                >
                  +{sessionXP}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(xpProgress)}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{xpNeeded.toLocaleString()} XP to level {level + 1}</p>
          </div>

          {/* Streak indicator */}
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-sm font-bold text-orange-500 tabular-nums">{currentStreak}</span>
            </div>
          )}
        </div>

        {/* Recent badges row */}
        {recentBadges.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t">
            <div className="flex -space-x-1">
              {recentBadges.slice(0, 3).map((badge, i) => (
                <motion.button
                  key={`${badge.id}-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedBadge(badge)}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-card flex items-center justify-center text-sm hover:scale-110 hover:z-10 transition-transform"
                  title={badge.name}
                >
                  {badge.icon}
                </motion.button>
              ))}
            </div>
            <Link
              href="/rewards"
              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
            >
              Rewards
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </motion.div>

      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  )
}

// Desktop widget - compact horizontal layout
function DesktopXPWidget() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null)

  const xpInLevel = Math.round((xpProgress / 100) * xpToNext)
  const xpNeeded = xpToNext - xpInLevel

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card border p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <Link
            href="/rewards"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            View rewards
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Main content row */}
        <div className="flex items-center gap-4">
          {/* Level ring */}
          <LevelRing level={level} progress={xpProgress} size={64} strokeWidth={5} />

          {/* XP details */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{totalXP.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">XP</span>
              {sessionXP > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-semibold text-green-500"
                >
                  +{sessionXP}
                </motion.span>
              )}
            </div>

            {/* Mini progress bar */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-8">{Math.round(xpProgress)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {xpNeeded.toLocaleString()} XP to level {level + 1}
            </p>
          </div>

          {/* Streak */}
          {currentStreak > 0 && (
            <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-orange-500/10">
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-lg font-bold text-orange-500 tabular-nums">{currentStreak}</span>
              </div>
              <span className="text-[10px] text-orange-600/70">day streak</span>
            </div>
          )}
        </div>

        {/* Badges row */}
        {recentBadges.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              Recent
            </div>
            <div className="flex -space-x-1">
              {recentBadges.slice(0, 5).map((badge, i) => (
                <motion.button
                  key={`${badge.id}-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedBadge(badge)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-card flex items-center justify-center text-base hover:scale-110 hover:z-10 transition-transform"
                  title={badge.name}
                >
                  {badge.icon}
                </motion.button>
              ))}
            </div>
            {recentBadges.length > 5 && (
              <span className="text-xs text-muted-foreground">+{recentBadges.length - 5}</span>
            )}
          </div>
        )}
      </motion.div>

      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  )
}

export function XPWidget() {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileXPCard />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopXPWidget />
      </div>
    </>
  )
}
