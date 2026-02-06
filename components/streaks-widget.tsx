"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame, Trophy, Target, Zap, Award, Star, ChevronRight, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  xp: number
  earnedAt: string | null
  progress?: number
  target?: number
}

interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  type: string
  target: number
  progress: number
  xpReward: number
  expiresAt: string
  completed: boolean
}

interface Level {
  level: number
  name: string
  minXp: number
  maxXp: number
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalOnsiteDays: number
  totalHours: number
  thisMonthDays: number
  perfectWeeks: number
  badges: BadgeData[]
  xp: number
  level: Level
  nextLevel: Level
  xpProgress: number
  xpToNext: number
  challenges: Challenge[]
}

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  uncommon: "bg-green-500/20 text-green-400 border-green-500/30",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

const rarityGlow: Record<string, string> = {
  common: "",
  uncommon: "shadow-green-500/20",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-amber-500/50 animate-pulse",
}

export function StreaksWidget() {
  const [data, setData] = useState<StreakData | null>(null)
  const [activeTab, setActiveTab] = useState<"streak" | "badges" | "challenges">("streak")
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)

  useEffect(() => {
    fetch("/api/streaks")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data) return null

  const earnedBadges = data.badges.filter((b) => b.earnedAt)
  const lockedBadges = data.badges.filter((b) => !b.earnedAt)
  const nextBadge = lockedBadges.sort((a, b) => {
    const aProgress = a.progress && a.target ? a.progress / a.target : 0
    const bProgress = b.progress && b.target ? b.progress / b.target : 0
    return bProgress - aProgress
  })[0]
  const activeChallenges = data.challenges.filter((c) => !c.completed)
  const completedChallenges = data.challenges.filter((c) => c.completed)
  const xpProgressPercent = data.xpToNext > 0 ? Math.min(100, (data.xpProgress / data.xpToNext) * 100) : 100

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      <CardContent className="p-4">
        {/* Level + XP Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {data.level.level}
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Star className="h-3 w-3 text-primary-foreground" />
            </motion.div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">{data.level.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{data.xp} XP</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={xpProgressPercent} className="h-2 flex-1" />
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {data.xpProgress}/{data.xpToNext}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {data.xpToNext - data.xpProgress} XP to {data.nextLevel.name}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-3">
          {[
            { id: "streak", icon: Flame, label: "Streak" },
            { id: "badges", icon: Trophy, label: `Badges (${earnedBadges.length})` },
            { id: "challenges", icon: Target, label: "Challenges" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "streak" && (
            <motion.div
              key="streak"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Current Streak */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  data.currentStreak > 0 ? "bg-amber-500/15" : "bg-muted"
                )}>
                  <Flame className={cn(
                    "h-6 w-6 transition-all",
                    data.currentStreak >= 10 ? "text-red-500 animate-pulse" :
                    data.currentStreak >= 5 ? "text-orange-500" :
                    data.currentStreak > 0 ? "text-amber-500" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <motion.span
                      key={data.currentStreak}
                      initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                      animate={{ scale: 1, color: "inherit" }}
                      className="text-3xl font-bold tabular-nums"
                    >
                      {data.currentStreak}
                    </motion.span>
                    <span className="text-sm text-muted-foreground">day streak</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Best: <span className="font-medium text-foreground">{data.longestStreak}</span> days
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: data.totalOnsiteDays, label: "On-Site", icon: "📍" },
                  { value: `${data.totalHours}h`, label: "Total", icon: "⏱️" },
                  { value: data.perfectWeeks, label: "Perfect Wks", icon: "✅" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <span className="text-sm mr-1">{stat.icon}</span>
                    <p className="text-lg font-bold tabular-nums inline">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Next badge progress */}
              {nextBadge && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setActiveTab("badges")
                    setSelectedBadge(nextBadge)
                  }}
                >
                  <span className="text-2xl">{nextBadge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{nextBadge.name}</p>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5", rarityColors[nextBadge.rarity])}>
                        {nextBadge.rarity}
                      </Badge>
                    </div>
                    {nextBadge.progress !== undefined && nextBadge.target !== undefined && (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(nextBadge.progress / nextBadge.target) * 100}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {nextBadge.progress}/{nextBadge.target}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Badge detail view */}
              <AnimatePresence mode="wait">
                {selectedBadge ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center",
                      selectedBadge.earnedAt ? rarityColors[selectedBadge.rarity] : "bg-muted/30 border-dashed"
                    )}
                  >
                    <button
                      onClick={() => setSelectedBadge(null)}
                      className="text-xs text-muted-foreground mb-2 hover:text-foreground"
                    >
                      &larr; All badges
                    </button>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="text-5xl block mb-2"
                    >
                      {selectedBadge.icon}
                    </motion.span>
                    <p className="font-bold text-lg">{selectedBadge.name}</p>
                    <div className="flex items-center justify-center gap-2 mt-1 mb-2">
                      <Badge variant="outline" className={cn("text-[10px]", rarityColors[selectedBadge.rarity])}>
                        {selectedBadge.rarity}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">+{selectedBadge.xp} XP</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedBadge.description}</p>
                    {selectedBadge.progress !== undefined && selectedBadge.target !== undefined && (
                      <div className="mt-3">
                        <Progress
                          value={Math.min(100, (selectedBadge.progress / selectedBadge.target) * 100)}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {selectedBadge.progress} / {selectedBadge.target}
                        </p>
                      </div>
                    )}
                    {selectedBadge.earnedAt && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Earned badges */}
                    {earnedBadges.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Earned ({earnedBadges.length})</p>
                        <div className="grid grid-cols-5 gap-2">
                          {earnedBadges.map((badge) => (
                            <motion.button
                              key={badge.id}
                              onClick={() => setSelectedBadge(badge)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "flex flex-col items-center gap-0.5 p-2 rounded-xl text-center transition-all border",
                                rarityColors[badge.rarity],
                                rarityGlow[badge.rarity],
                                "shadow-lg"
                              )}
                            >
                              <span className="text-xl">{badge.icon}</span>
                              <span className="text-[8px] font-medium leading-tight line-clamp-1">{badge.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locked badges */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Locked ({lockedBadges.length})</p>
                      <div className="grid grid-cols-5 gap-2">
                        {lockedBadges.slice(0, 10).map((badge) => (
                          <motion.button
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-center bg-muted/30 opacity-50 grayscale hover:opacity-70 transition-all"
                          >
                            <span className="text-xl">{badge.icon}</span>
                            <span className="text-[8px] font-medium leading-tight line-clamp-1">{badge.name}</span>
                          </motion.button>
                        ))}
                      </div>
                      {lockedBadges.length > 10 && (
                        <Link href="/rewards" className="block text-center text-xs text-primary mt-2 hover:underline">
                          View all {lockedBadges.length} locked badges &rarr;
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "challenges" && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border"
                  >
                    <span className="text-2xl">{challenge.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{challenge.name}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5">
                          {challenge.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">{challenge.description}</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(challenge.progress / challenge.target) * 100}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {challenge.progress}/{challenge.target}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                      +{challenge.xpReward} XP
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">All challenges completed!</p>
                </div>
              )}

              {completedChallenges.length > 0 && (
                <div className="pt-2 border-t mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Completed</p>
                  {completedChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-success/10 text-success"
                    >
                      <span>{challenge.icon}</span>
                      <span className="text-xs font-medium flex-1">{challenge.name}</span>
                      <span className="text-[10px]">+{challenge.xpReward} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
