"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame, Shield, Sparkles, Star, Zap, Coins, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileHeroProps {
  level: number
  title: string
  totalXp: number
  xpInLevel: number
  xpForLevel: number
  progress: number
  nextLevelTitle: string | null
  nextLevel: number | null
  currentStreak: number
  streakShields: number
  xpMultiplier: number
  coins: number
  activeTitle?: string | null
}

export function ProfileHero({
  level,
  title,
  totalXp,
  xpInLevel,
  xpForLevel,
  progress,
  nextLevelTitle,
  nextLevel,
  currentStreak,
  streakShields,
  xpMultiplier,
  coins,
  activeTitle,
}: ProfileHeroProps) {
  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Level Badge */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-orange-500/30">
                <span className="text-4xl font-bold">{level}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80">Level</span>
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                <Star className="h-4 w-4 text-primary-foreground fill-current" />
              </motion.div>
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold">{activeTitle || title}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                  <Zap className="h-3 w-3 mr-1" />
                  {totalXp.toLocaleString()} XP
                </Badge>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  <Coins className="h-3 w-3 mr-1" />
                  {coins.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="flex-1">
            {nextLevel && nextLevelTitle ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress to {nextLevelTitle}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {xpInLevel.toLocaleString()} / {xpForLevel.toLocaleString()} XP
                  </span>
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground drop-shadow">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <Sparkles className="h-3 w-3 inline mr-1 text-amber-500" />
                  {(xpForLevel - xpInLevel).toLocaleString()} XP needed to reach Level {nextLevel}
                </p>
              </>
            ) : (
              <div className="text-center py-2">
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  MAX LEVEL
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums text-purple-500">{xpMultiplier.toFixed(2)}x</p>
              <p className="text-[10px] text-muted-foreground">Multiplier</p>
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
        </div>
      </CardContent>
    </Card>
  )
}
