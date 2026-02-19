"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Widget } from "@/components/dashboard/widget-grid"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
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
  Coins,
  Shield,
  Zap,
  TrendingUp,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgLink as Link } from "@/components/org-link"

interface BadgeInfo {
  id: string
  name: string
  icon: string
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
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-center">Badge Earned</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4"
          >
            <span className="text-5xl">{badge.icon}</span>
          </motion.div>
          <h3 className="text-lg font-bold text-center mb-2">{badge.name}</h3>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Recently Earned
          </Badge>
          <Link
            href="/rewards"
            className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
            onClick={onClose}
          >
            View all badges
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MobileXPCard() {
  const { totalXP, sessionXP, level, xpToNext, xpProgress, coins, streakShields, xpMultiplier, activeTitle } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null)

  const xpInLevel = Math.round((xpProgress / 100) * xpToNext)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border overflow-hidden"
      >
        {/* Gradient header bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />

        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Level badge - matching rewards page */}
            <div className="w-16 h-16 rounded-xl bg-primary flex flex-col items-center justify-center text-primary-foreground flex-shrink-0">
              <span className="text-2xl font-bold">{level}</span>
              <span className="text-[8px] uppercase tracking-wider opacity-80">Level</span>
            </div>

            {/* XP info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">
                  {activeTitle || `Level ${level}`}
                </span>
                {xpMultiplier > 1.0 && (
                  <Badge variant="secondary" className="gap-0.5 text-[10px] h-5 bg-purple-500/10 text-purple-600 border-purple-500/20">
                    <TrendingUp className="h-2.5 w-2.5" />
                    {xpMultiplier.toFixed(1)}x
                  </Badge>
                )}
              </div>

              {/* XP and Coins badges */}
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[10px] h-5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  {totalXP.toLocaleString()} XP
                </Badge>
                {coins > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    <Coins className="h-2.5 w-2.5 mr-0.5" />
                    {coins}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Next level</span>
              <span className="font-medium tabular-nums">{xpInLevel} / {xpToNext} XP</span>
            </div>
            <div className="relative">
              <Progress value={xpProgress} className="h-3" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary-foreground drop-shadow">
                  {Math.round(xpProgress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums text-orange-500">{currentStreak}</p>
                <p className="text-[9px] text-muted-foreground">Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums text-blue-500">{streakShields}</p>
                <p className="text-[9px] text-muted-foreground">Shields</p>
              </div>
            </div>
            {sessionXP > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold tabular-nums text-green-500">+{sessionXP}</p>
                  <p className="text-[9px] text-muted-foreground">Session</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Recent badges - clickable */}
          {recentBadges.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium">Recent Badges</span>
                </div>
                <Link
                  href="/rewards"
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex gap-2">
                {recentBadges.slice(0, 4).map((badge, i) => (
                  <motion.button
                    key={`${badge.id}-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedBadge(badge)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-lg hover:scale-110 transition-transform"
                    title={badge.name}
                  >
                    {badge.icon}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
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
  const { totalXP, sessionXP, level, xpToNext, xpProgress, coins, streakShields, xpMultiplier, activeTitle } = useLiveXP()
  const { recentBadges, currentStreak } = useRealtime()
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null)

  const xpInLevel = Math.round((xpProgress / 100) * xpToNext)

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileXPCard />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="rounded-2xl border bg-card overflow-hidden">
          {/* Gradient header bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />

          <div className="p-5">
            {/* Header with link */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Progress & Rewards</span>
              </div>
              <Link
                href="/rewards"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Level and XP section */}
            <div className="flex items-center gap-5">
              {/* Level badge - matching rewards page */}
              <div className="w-20 h-20 rounded-2xl bg-primary flex flex-col items-center justify-center text-primary-foreground flex-shrink-0">
                <span className="text-3xl font-bold">{level}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80">Level</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold">{activeTitle || `Level ${level}`}</h3>
                  {xpMultiplier > 1.0 && (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {xpMultiplier.toFixed(1)}x
                    </Badge>
                  )}
                </div>

                {/* XP and Coins badges */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Zap className="h-3 w-3 mr-1" />
                    {totalXP.toLocaleString()} XP
                  </Badge>
                  {coins > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      <Coins className="h-3 w-3 mr-1" />
                      {coins.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress to next level</span>
                <span className="font-medium tabular-nums">{xpInLevel.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
              </div>
              <div className="relative">
                <Progress value={xpProgress} className="h-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground drop-shadow">
                    {Math.round(xpProgress)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <Sparkles className="h-3 w-3 inline mr-1 text-amber-500" />
                {(xpToNext - xpInLevel).toLocaleString()} XP needed to level up
              </p>
            </div>

            {/* Quick stats row */}
            <div className="mt-5 pt-5 border-t grid grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-orange-500">{currentStreak}</p>
                  <p className="text-[10px] text-muted-foreground">Day Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-blue-500">{streakShields}</p>
                  <p className="text-[10px] text-muted-foreground">Shields</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Coins className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-yellow-600">{coins}</p>
                  <p className="text-[10px] text-muted-foreground">Coins</p>
                </div>
              </div>
              {sessionXP > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums text-green-500">+{sessionXP}</p>
                    <p className="text-[10px] text-muted-foreground">Session XP</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Recent badges - clickable */}
            {recentBadges.length > 0 && (
              <div className="mt-5 pt-5 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">Recent Badges</span>
                  <Badge variant="secondary" className="text-[10px]">{recentBadges.length} earned</Badge>
                </div>
                <div className="flex gap-3">
                  {recentBadges.slice(0, 5).map((badge, i) => (
                    <motion.button
                      key={`${badge.id}-${i}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setSelectedBadge(badge)}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40 hover:scale-105 transition-all min-w-[64px]"
                      title={badge.name}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="text-[10px] font-medium text-center leading-tight line-clamp-1">
                        {badge.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  )
}
